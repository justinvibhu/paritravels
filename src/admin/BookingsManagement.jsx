import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, vehicle, tour

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Fetch both vehicle and tour bookings
      const [vehicleRes, tourRes] = await Promise.all([
        fetch(`${API_URL}/bookings`),
        fetch(`${API_URL}/tour-bookings`)
      ]);

      let allBookings = [];

      if (vehicleRes.ok) {
        const vehicleData = await vehicleRes.json();
        allBookings = [...(vehicleData || [])];
      }

      if (tourRes.ok) {
        const tourData = await tourRes.json();
        allBookings = [...allBookings, ...(tourData || [])];
      }

      setBookings(allBookings);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_URL}/drivers`);
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(data || []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      // Non-critical, so we don't set a main error
    }
  };

  const handleUpdateBooking = async (booking, payload) => {
    try {
      const bookingId = booking.id;
      const isTourBooking = booking.bookingType === 'tour' || booking.tourId;
      const endpoint = isTourBooking ? `${API_URL}/tour-bookings/${bookingId}` : `${API_URL}/bookings/${bookingId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update booking');
      }

      const updatedBooking = await response.json();

      // Update local state to reflect the change immediately
      setBookings((prevBookings) =>
        prevBookings.map((b) => {
          if (b.id === bookingId) {
            return {
              ...b,
              ...updatedBooking,
            };
          }
          return b;
        })
      );
    } catch (err) {
      console.error("Error updating booking:", err);
      alert("Failed to update booking.");
    }
  };

  const handleStatusChange = (booking, newStatus) => {
    handleUpdateBooking(booking, { bookingStatus: newStatus });
  };

  const handleDriverChange = (booking, newDriverId) => {
    const driverId = newDriverId === '' ? null : Number(newDriverId);
    handleUpdateBooking(booking, { driverId });
  };

  const handleDelete = async (booking) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        const isTourBooking = booking.bookingType === 'tour' || booking.tourId;
        const endpoint = isTourBooking ? `${API_URL}/tour-bookings/${booking.id}` : `${API_URL}/bookings/${booking.id}`;
        await fetch(endpoint, { method: 'DELETE' });
        fetchBookings(); // Refetch all bookings
      } catch (err) {
        console.error("Error deleting booking:", err);
        alert("Failed to delete booking.");
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Loading bookings...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  // Filter bookings
  let filteredBookings = bookings;
  
  if (filterType === "vehicle") {
    filteredBookings = filteredBookings.filter(b => !b.tourId && b.bookingType !== 'tour');
  } else if (filterType === "tour") {
    filteredBookings = filteredBookings.filter(b => b.tourId || b.bookingType === 'tour');
  }

  // Search filter
  filteredBookings = filteredBookings.filter(b => 
    (b.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (b.bookingId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (b.id !== undefined && b.id !== null ? b.id.toString().includes(searchTerm) : false)
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-3 font-semibold border-b-2 transition-all ${
            filterType === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setFilterType("vehicle")}
          className={`px-4 py-3 font-semibold border-b-2 transition-all ${
            filterType === "vehicle"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Vehicle Bookings ({bookings.filter(b => !b.tourId && b.bookingType !== 'tour').length})
        </button>
        <button
          onClick={() => setFilterType("tour")}
          className={`px-4 py-3 font-semibold border-b-2 transition-all ${
            filterType === "tour"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Tour Bookings ({bookings.filter(b => b.tourId || b.bookingType === 'tour').length})
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer / Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route / Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Driver</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => {
              const isTourBooking = booking.tourId || booking.bookingType === 'tour';
              const bookingTypeLabel = isTourBooking ? 'Tour' : 'Vehicle';
              
              return (
                <tr key={booking.id?.toString() || `${booking.customerName}-${booking.travelDate || ''}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.bookingId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.customerName || 'Guest'}</div>
                    <div className="text-sm text-gray-500">
                      {isTourBooking ? (booking.tourName || 'N/A') : (booking.vehicleName || 'N/A')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isTourBooking 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bookingTypeLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isTourBooking 
                      ? (booking.destination || booking.origin || 'N/A')
                      : `${booking.origin || ''} to ${booking.destination || ''}`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{booking.amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={booking.bookingStatus?.toLowerCase() || 'pending'}
                      onChange={(e) => handleStatusChange(booking, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border outline-none ${
                        booking.bookingStatus?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                        booking.bookingStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={booking.driverId || ''}
                      onChange={(e) => handleDriverChange(booking, e.target.value)}
                      disabled={isTourBooking}
                      className="w-full text-xs font-semibold rounded-full px-2 py-1 border outline-none bg-gray-50 border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">Unassigned</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(booking)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              );
            })}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}