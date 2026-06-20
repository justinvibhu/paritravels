import { useEffect, useState } from 'react';

export function SeatSelector({ vehicleId, date, onSeatsSelected }) {
  const [seats, setSeat] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]); // will store seat labels (e.g., 'C4')
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId || !date) return;

    const fetchSeats = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [vehicleId, date]);

  const toggleSeat = (seatNumber) => {
    let newSelected;
    if (selectedSeats.includes(seatNumber)) {
      newSelected = selectedSeats.filter(s => s !== seatNumber);
    } else {
      newSelected = [...selectedSeats, seatNumber];
    }
    setSelectedSeats(newSelected);
    if (typeof onSeatsSelected === 'function') onSeatsSelected(newSelected);
  };

  if (loading) return <div className="p-4 text-center">Loading seats...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!seats) return null;

  // Arrange seats in a grid (4 columns for simplicity)
  const seatsPerRow = 4;
  const totalRows = Math.ceil(seats.capacity / seatsPerRow);

  // Helper to generate seat label for index i (0-based) => A1, A2, ...
  const getLabelForIndex = (i) => {
    const row = Math.floor(i / seatsPerRow); // 0-based
    const col = (i % seatsPerRow) + 1; // 1-based
    const rowLetter = String.fromCharCode(65 + row); // 65 = 'A'
    return `${rowLetter}${col}`;
  };

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Select Seats</h3>
      <p className="text-sm text-gray-600 mb-4">
        Available: <span className="font-bold text-green-600">{seats.totalAvailable}</span> | 
        Booked: <span className="font-bold text-red-600">{seats.totalBooked}</span>
      </p>

      {/* Seat Grid */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, 1fr)` }}>
          {Array.from({ length: seats.capacity }).map((_, i) => {
            const seatNum = i + 1;
            const label = getLabelForIndex(i);

            // bookedSeats may contain either seat_number or seat_label depending on how data was stored
            const bookedByNumber = seats.bookedSeats.some(s => s.seatNumber === seatNum);
            const bookedByLabel = seats.bookedSeats.some(s => (s.seatLabel || s.seat_label) === label);
            const isBooked = bookedByNumber || bookedByLabel;
            const isSelected = selectedSeats.includes(label);

            return (
              <button
                key={label}
                onClick={() => !isBooked && toggleSeat(label)}
                disabled={isBooked}
                className={`w-12 h-12 rounded flex items-center justify-center font-bold text-sm transition ${
                  isBooked
                    ? 'bg-red-300 text-gray-600 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-600 text-white border-2 border-blue-800'
                    : 'bg-green-200 text-gray-800 border-2 border-green-400 hover:bg-green-300'
                }`}
                title={isBooked ? `Seat ${label} is booked` : `Seat ${label}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Booked Seats Info */}
      {seats.bookedSeats.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-sm text-red-800 mb-2">Booked Seats:</h4>
          <div className="text-sm text-red-700">
            {seats.bookedSeats.map(seat => (
              <div key={seat.seatNumber}>
                Seat {seat.seatLabel}: {seat.passengerName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Seats Summary */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="font-semibold text-sm text-blue-800">
          Selected Seats: <span className="font-bold">{selectedSeats.length}</span>
        </p>
        {selectedSeats.length > 0 && (
          <p className="text-sm text-blue-700 mt-1">
            Seats: {selectedSeats.sort((a, b) => a - b).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
