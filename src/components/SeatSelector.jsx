import { useEffect, useState } from 'react';

const normalizeSeatLabel = (s) => (s === null || s === undefined ? '' : String(s).trim().toUpperCase());

export function SeatSelector({ vehicleId, date, onSeatsSelected, onAvailabilityChange }) {
  const [seats, setSeat] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [fullyBooked, setFullyBooked] = useState(false);

  useEffect(() => {
    if (!vehicleId || !date) return;

    setSelectedSeats([]);
    setWarning(null);
    setError(null);
    if (onSeatsSelected) onSeatsSelected([]);
    if (onAvailabilityChange) {
      onAvailabilityChange({ totalAvailable: null, capacity: null, totalBooked: null });
    }

    const fetchSeats = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const url = `${API_URL}/vehicles/${vehicleId}/seats?date=${date}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          const body = await resp.text().catch(() => '');
          const msg = `Failed to fetch seats (status ${resp.status}) ${body ? `- ${body}` : ''}`;
          console.error('Seat fetch error:', resp.status, body);
          throw new Error(msg);
        }
        const data = await resp.json();
        setSeat(data);
        setFullyBooked(data.fullyBooked === true);
        if (onAvailabilityChange) {
          onAvailabilityChange({
            totalAvailable: data.totalAvailable,
            capacity: data.capacity,
            totalBooked: data.totalBooked,
          });
        }
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [vehicleId, date, onSeatsSelected, onAvailabilityChange]);

  const validateSeatsBeforeSelection = async (seatsToBook) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/validate-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          seatLabels: seatsToBook,
          date,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setWarning(errData.message || 'Cannot book these seats');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Validation error:', err);
      return true; // Proceed anyway if validation endpoint fails
    }
  };

  const toggleSeat = async (seatLabel) => {
    setWarning(null);

    // Check if seat is already booked
    const bookedLabels = new Set((seats?.bookedSeats || []).map((s) => normalizeSeatLabel(s.seatLabel || s.seat_label)));
    if (bookedLabels.has(seatLabel)) {
      return; // Can't select booked seats
    }

    let newSelected;
    if (selectedSeats.includes(seatLabel)) {
      newSelected = selectedSeats.filter((s) => s !== seatLabel);
    } else {
      newSelected = [...selectedSeats, seatLabel];
      
      // Validate before adding
      const isValid = await validateSeatsBeforeSelection(newSelected);
      if (!isValid) {
        return;
      }

      // Check if seat is adjacent to female and warn
      const adjacentFemales = seats?.adjacentFemaleSeats?.[seatLabel] || [];
      if (adjacentFemales.length > 0) {
        setWarning(`⚠️ Seat ${seatLabel} is adjacent to female passengers (${adjacentFemales.join(', ')}). Proceed with booking?`);
      }
    }

    setSelectedSeats(newSelected);
    if (typeof onSeatsSelected === 'function') onSeatsSelected(newSelected);
  };

  if (loading) return <div className="p-4 text-center text-gray-600">Loading seats...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded border border-red-200">❌ Error: {error}</div>;
  if (!seats) return null;

  const layout = seats.layout || [];
  const bookedSeatsMap = {};
  (seats.bookedSeats || []).forEach((seat) => {
    const label = normalizeSeatLabel(seat.seatLabel || seat.seat_label || seat.seatNumber);
    bookedSeatsMap[label] = seat;
  });

  const renderSeatCell = (cell, index) => {
    if (!cell) return <div key={`${cell?.id || index}`} className="w-12 h-12" />;
    if (cell.type === 'driver') return (
      <div key={cell.id || `driver-${index}`} className="w-12 h-12 rounded-lg bg-blue-900 text-white text-xs flex items-center justify-center font-semibold">🚗</div>
    );
    if (cell.type === 'aisle') return <div key={cell.id || `aisle-${index}`} className="w-12 h-12" />;
    if (cell.type === 'empty') return <div key={cell.id || `empty-${index}`} className="w-12 h-12 opacity-0" />;

    const label = normalizeSeatLabel(cell.label || cell.seatLabel || cell.seatNumber);
    const bookedSeat = bookedSeatsMap[label];
    const isBooked = !!bookedSeat;
    const isSelected = selectedSeats.includes(label);
    const isAdjacentFemale = (seats?.adjacentFemaleSeats?.[label] || []).length > 0;

    // Determine seat background color based on gender
    let bgColor = 'bg-green-200';
    let borderColor = 'border-green-400';
    let textColor = 'text-gray-800';
    let title = `Seat ${label} - Available`;

    if (isBooked) {
      if (bookedSeat.gender === 'female') {
        bgColor = 'bg-pink-300';
        borderColor = 'border-pink-500';
        textColor = 'text-gray-800';
        title = `Seat ${label} - Female (${bookedSeat.passengerName})`;
      } else if (bookedSeat.gender === 'male') {
        bgColor = 'bg-blue-300';
        borderColor = 'border-blue-500';
        textColor = 'text-gray-800';
        title = `Seat ${label} - Male (${bookedSeat.passengerName})`;
      } else {
        bgColor = 'bg-gray-300';
        borderColor = 'border-gray-500';
        textColor = 'text-gray-600';
        title = `Seat ${label} - Booked (${bookedSeat.passengerName})`;
      }
    } else {
      // Available seats
      borderColor = 'border-purple-500';
      title = `Seat ${label} - Adjacent to female passenger`;
    }

    return (
      <button
        key={cell.id || label || `seat-${index}`}
        onClick={() => !isBooked && toggleSeat(label)}
        disabled={isBooked}
        className={`w-12 h-12 rounded flex items-center justify-center font-bold text-sm transition ${
          isBooked
            ? `${bgColor} ${textColor} cursor-not-allowed`
            : isSelected 
            ? 'bg-blue-600 text-white border-2 border-blue-800'
            : `${bgColor} ${textColor} border-2 ${borderColor} hover:opacity-80`
        }`}
        title={title}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Seats</h3>
        <div className="text-sm font-semibold">
          <span className={fullyBooked ? 'text-red-600' : 'text-green-600'}>
            {seats.totalAvailable} / {seats.capacity} Available
          </span>
        </div>
      </div>
      
      {fullyBooked && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded text-sm text-red-700 font-semibold">
          🚫 This vehicle is fully booked for the selected date.
        </div>
      )}

      {/* Legend */}
      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">Seat Status Legend:</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-200 border-2 border-green-400"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white border-2 border-blue-800"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-pink-300 border-2 border-pink-500"></div>
            <span>Female</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-300 border-2 border-blue-500"></div>
            <span>Male</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-200 border-2 border-purple-500"></div>
            <span>Adj Female</span>
          </div>
        </div>
      </div>

      {warning && (
        <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded text-sm text-yellow-800">
          {warning}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.max(...layout.map((row) => row.length)))}, 1fr)` }}>
          {layout.length > 0 ? (
            layout.flat().map(renderSeatCell)
          ) : (
            <div className="col-span-full text-center text-gray-500 py-4">No seat layout available</div>
          )}
        </div>
      </div>

      {seats.bookedSeats?.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Booked Seats ({seats.totalBooked}/{seats.capacity}):</h4>
          <div className="text-sm text-gray-600">
            {seats.bookedSeats.map((seat) => (
              <div key={`${seat.seatLabel || seat.seat_label || seat.seatNumber}`}> 
                • {seat.seatLabel || seat.seat_label || seat.seatNumber}: {seat.passengerName} ({seat.gender})
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSeats.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs font-semibold text-gray-600 mb-2">Selected Seats: <span className="font-bold text-blue-600">{selectedSeats.length}</span></p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSeats.map(s => <span key={s} className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
