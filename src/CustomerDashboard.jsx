import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { getUserBookings } from './supabase/db';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Ticket, LogOut } from 'lucide-react';

export default function CustomerDashboard({ navigate }) {
  const { currentUser, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'profile'

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!currentUser) {
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userBookings = await getUserBookings(currentUser.id);
        setBookings(userBookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchUserBookings();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('home');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to view your dashboard.</p>
          <button
            onClick={() => navigate('login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              <ArrowLeft size={20} /> Back
            </button>
            <div>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>
                My Dashboard
              </h1>
              <p className="text-white/80 text-sm">Welcome, {currentUser.email}!</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'bookings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Ticket size={18} />
              My Bookings ({bookings.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              My Profile
            </div>
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-600">Loading your bookings...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-blue-50">
                <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-600 mb-6">You haven't made any bookings. Let's book your first journey!</p>
                <button
                  onClick={() => navigate('booking')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Book Now
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <div key={booking.bookingId || booking.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden hover:shadow-md transition">
                    {/* Status Bar */}
                    <div className={`h-1 ${
                      booking.bookingStatus?.toLowerCase() === 'confirmed' ? 'bg-green-500' :
                      booking.bookingStatus?.toLowerCase() === 'cancelled' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />

                    <div className="p-6">
                      {/* Header with ID and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Booking ID</p>
                          <h3 className="text-lg font-bold text-gray-900">{booking.bookingId}</h3>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          booking.bookingStatus?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.bookingStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.bookingStatus || 'Pending'}
                        </span>
                      </div>

                      {/* Main Details Grid */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Route */}
                        <div className="flex items-start gap-3">
                          <MapPin size={20} className="text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Route</p>
                            <p className="font-semibold text-gray-900">{booking.origin || booking.from} → {booking.destination || booking.to}</p>
                          </div>
                        </div>

                        {/* Vehicle */}
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                          <p className="font-semibold text-gray-900">{booking.vehicleName || booking.vehicle}</p>
                        </div>

                        {/* Travel Date */}
                        <div className="flex items-start gap-3">
                          <Calendar size={20} className="text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Travel Date</p>
                            <p className="font-semibold text-gray-900">
                              {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Passengers */}
                        <div className="flex items-start gap-3">
                          <Users size={20} className="text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Passengers & Seats</p>
                            <p className="font-semibold text-gray-900">
                              {booking.passengers?.length || 1} {booking.passengers?.length > 1 ? 'Passengers' : 'Passenger'}
                              {booking.seatNumbers && ` • Seats: ${booking.seatNumbers.join(', ')}`}
                            </p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-start gap-3">
                          <DollarSign size={20} className="text-green-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Amount</p>
                            <p className="font-bold text-green-600 text-lg">
                              ₹{booking.amount || booking.amountText || '0'}
                            </p>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                            booking.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.paymentStatus?.toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Booking Date */}
                      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                        Booked on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Email Address</label>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900">
                    {currentUser.email}
                  </div>
                </div>

                {/* User ID */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">User ID</label>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-500 font-mono text-sm">
                    {currentUser.id}
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Account Status</label>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-gray-900 font-semibold">Active</span>
                  </div>
                </div>

                {/* Booking Stats */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {bookings.filter(b => b.bookingStatus?.toLowerCase() === 'confirmed').length}
                      </p>
                      <p className="text-sm text-gray-600">Confirmed</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
