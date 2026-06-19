import React, { useState, useEffect } from "react";
import { getAllBookings, updateBooking, deleteBooking } from "../supabase/db";

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (booking) => {
    const identifier = booking.id ?? booking.bookingId;
    if (!identifier) {
      alert("Cannot update this booking because it has no identifier.");
      return;
    }

    try {
      if (booking.id) {
        await updateBooking(identifier.toString(), { bookingStatus: booking.bookingStatus });
      } else {
        const bookingKey = `booking_${booking.bookingId}`;
        const stored = localStorage.getItem(bookingKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.bookingStatus = booking.bookingStatus;
          localStorage.setItem(bookingKey, JSON.stringify(parsed));
        }
      }

      setBookings((prevBookings) =>
        prevBookings.map((b) => {
          if (booking.id !== undefined && booking.id !== null) {
            return b.id === booking.id ? { ...b, bookingStatus: booking.bookingStatus } : b;
          }
          return b.bookingId === booking.bookingId ? { ...b, bookingStatus: booking.bookingStatus } : b;
        })
      );
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (booking) => {
    const identifier = booking.id ?? booking.bookingId;
    if (!identifier) {
      alert("Cannot delete this booking because it has no identifier.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        if (booking.id !== undefined && booking.id !== null) {
          await deleteBooking(identifier.toString());
        } else {
          localStorage.removeItem(`booking_${booking.bookingId}`);
        }
        setBookings((prevBookings) =>
          prevBookings.filter((b) => {
            if (booking.id !== undefined && booking.id !== null) {
              return b.id !== booking.id;
            }
            return b.bookingId !== booking.bookingId;
          })
        );
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

  const filteredBookings = bookings.filter(b => 
    (b.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (b.bookingId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (b.id !== undefined && b.id !== null ? b.id.toString().includes(searchTerm) : false)
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
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

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer / Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.bookingId || booking.id?.toString() || `${booking.customerName}-${booking.travelDate || ''}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {booking.bookingId || (booking.id ? booking.id.toString().slice(0, 8) : 'N/A')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.customerName || 'Guest'}</div>
                  <div className="text-sm text-gray-500">{booking.vehicleName || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.origin} to {booking.destination}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{booking.amount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={booking.bookingStatus?.toLowerCase() || 'pending'}
                      onChange={(e) => handleStatusChange({ ...booking, bookingStatus: e.target.value })}
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(booking)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}