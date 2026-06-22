import { useEffect, useState } from 'react';

const normalizeSeatLabel = (s) => (s === null || s === undefined ? '' : String(s).trim().toUpperCase());

export function AdminSeatManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSeatLabel, setSelectedSeatLabel] = useState('');
  const [passengerName, setPassengerName] = useState('Manual Booking');
  const [passengerGender, setPassengerGender] = useState('not_specified');
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch all vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const resp = await fetch(`${API_URL}/vehicles`);
        if (!resp.ok) {
          const errorBody = await resp.json().catch(() => ({ error: 'Failed to fetch vehicles' }));
          throw new Error(errorBody.error || `Request failed with status ${resp.status}`);
        }
        const data = await resp.json();
        setVehicles(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch seat data for selected vehicle
  const fetchSeats = async () => {
    if (!selectedVehicle) {
      setSeatData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const url = `${API_URL}/admin/vehicles/${selectedVehicle}/seats${selectedDate ? `?date=${selectedDate}` : ''}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch seats');
      const data = await resp.json();
      setSeatData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [selectedVehicle, selectedDate]);

  const handleDeleteSeat = async (seatId) => {
    if (!confirm('Remove this seat booking?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const resp = await fetch(`${API_URL}/seat-bookings/${seatId}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete seat booking');
      setSuccess('Seat booking removed successfully.');
      fetchSeats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleManualBook = async () => {
    if (!selectedVehicle || !selectedSeatLabel) {
      setError('Select a vehicle and seat label before booking.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const payload = {
        vehicleId: Number(selectedVehicle),
        bookingId: `ADMIN-${Date.now()}`,
        seatNumbers: [selectedSeatLabel],
        passengerName: passengerName || 'Manual Booking',
        travelDate: selectedDate,
        // Pass gender info in the 'passengers' array for consistency with the main booking flow
        passengers: [{
          name: passengerName || 'Manual Booking',
          seat: selectedSeatLabel,
          seatLabel: selectedSeatLabel,
          gender: passengerGender,
        }],
      };
      const resp = await fetch(`${API_URL}/seat-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to book seat.');
      }

      setSuccess(`Seat ${selectedSeatLabel} marked booked for ${selectedDate}.`);
      setSelectedSeatLabel('');
      setPassengerGender('not_specified');
      fetchSeats();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Vehicle Seats</h2>

      {/* Vehicle Selector */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold mb-2">Select Vehicle:</label>
          <select
            value={selectedVehicle || ''}
            onChange={(e) => setSelectedVehicle(Number(e.target.value) || null)}
            className="w-full max-w-md p-2 border rounded"
          >
          <option value="">-- Choose a vehicle --</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} (ID: {v.id}) - Capacity: {v.capacity}
            </option>
          ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Travel Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full max-w-md p-2 border rounded"
          />
        </div>
      </div>

      {success && <div className="p-4 mb-4 bg-green-50 text-green-700 rounded">{success}</div>}
      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {loading && <div className="p-4 text-center text-gray-600">Loading...</div>}

      {/* Seat Data Display */}
      {seatData && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-bold mb-4">{seatData.vehicle.name}</h3>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-blue-600">{seatData.vehicle.capacity}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Booked Seats</p>
              <p className="text-2xl font-bold text-green-600">{seatData.seatBookings.length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <p className="text-sm text-gray-600">Available Seats</p>
              <p className="text-2xl font-bold text-yellow-700">{Math.max(seatData.vehicle.capacity - seatData.seatBookings.length, 0)}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
              <h4 className="font-semibold mb-3">Seat Layout</h4>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, ...((seatData.layout || []).map((row) => row.length)))}, minmax(0, 1fr))` }}>
                {(seatData.layout || []).flat().map((cell) => {
                  if (cell.type !== 'seat') return <div key={cell.id} />;
                  const label = normalizeSeatLabel(cell.label);
                  const booked = seatData.seatBookings.some((seat) => normalizeSeatLabel(seat.seatLabel) === label);
                  const isSelected = selectedSeatLabel === label;
                  return (
                    <button
                      key={cell.id || label}
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold ${booked ? 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed' : isSelected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
                      onClick={() => !booked && setSelectedSeatLabel(label)}
                      disabled={booked}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {!seatData.layout || seatData.layout.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No seat layout available. The layout is dynamically generated based on vehicle capacity.
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-gray-200 p-4 bg-white">
              <h4 className="font-semibold mb-3">Manual Booking</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seat Label</label>
                  <input
                    type="text"
                    value={selectedSeatLabel}
                    onChange={(e) => setSelectedSeatLabel(e.target.value.toUpperCase())}
                    placeholder="A1"
                    className="w-full rounded-xl border border-gray-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Name</label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Gender</label>
                  <select
                    value={passengerGender}
                    onChange={(e) => setPassengerGender(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 bg-white"
                  >
                    <option value="not_specified">Not Specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleManualBook}
                  disabled={saving || !selectedSeatLabel}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Mark Seat Booked'}
                </button>
                {selectedSeatLabel && (
                  <p className="text-sm text-gray-500">Selected manual seat: <strong>{selectedSeatLabel}</strong></p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-blue-600">{seatData.vehicle.capacity}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Available Seats</p>
              <p className="text-2xl font-bold text-green-600">
                {seatData.vehicle.capacity - seatData.seatBookings.length}
              </p>
            </div>
          </div>

          {/* Booked Seats Table */}
          {seatData.seatBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <h4 className="text-lg font-semibold mb-3">Booked Seats</h4>
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2 text-left">Seat #</th>
                    <th className="border p-2 text-left">Passenger</th>
                    <th className="border p-2 text-left">Booking ID</th>
                    <th className="border p-2 text-left">Customer</th>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Travel Date</th>
                    <th className="border p-2 text-left">Status</th>
                    <th className="border p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {seatData.seatBookings.map(seat => (
                    <tr key={seat.id} className="hover:bg-gray-100">
                      <td className="border p-2 font-bold">{seat.seatLabel || seat.seat_label}</td>
                      <td className="border p-2">{seat.passengerName}</td>
                      <td className="border p-2">{seat.bookings?.id || 'N/A'}</td>
                      <td className="border p-2">{seat.bookings?.customerName || 'N/A'}</td>
                      <td className="border p-2 text-sm">{seat.bookings?.userEmail || 'N/A'}</td>
                      <td className="border p-2">{seat.bookings?.travelDate || 'N/A'}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          seat.bookings?.bookingStatus === 'confirmed'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {seat.bookings?.bookingStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleDeleteSeat(seat.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No booked seats for this vehicle.</p>
          )}
        </div>
      )}
    </div>
  );
}
