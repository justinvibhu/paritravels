import { useEffect, useState } from 'react';

export function AdminSeatManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const resp = await fetch(`${API_URL}/vehicles`);
        if (!resp.ok) throw new Error('Failed to fetch vehicles');
        const data = await resp.json();
        setVehicles(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch seat data for selected vehicle
  useEffect(() => {
    if (!selectedVehicle) {
      setSeatData(null);
      return;
    }

    const fetchSeats = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const resp = await fetch(`${API_URL}/admin/vehicles/${selectedVehicle}/seats`);
        if (!resp.ok) throw new Error('Failed to fetch seats');
        const data = await resp.json();
        setSeatData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedVehicle]);

  const handleDeleteSeat = async (seatId) => {
    if (!confirm('Remove this seat booking?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const resp = await fetch(`${API_URL}/seat-bookings/${seatId}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete seat booking');

      // Refresh seat data
      setSelectedVehicle(selectedVehicle);
      alert('Seat booking removed successfully');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Vehicle Seats</h2>

      {/* Vehicle Selector */}
      <div className="mb-6">
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

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {loading && <div className="p-4 text-center text-gray-600">Loading...</div>}

      {/* Seat Data Display */}
      {seatData && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-bold mb-4">{seatData.vehicle.name}</h3>

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
                      <td className="border p-2 font-bold">{seat.seatLabel}</td>
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
