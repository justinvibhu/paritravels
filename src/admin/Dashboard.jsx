import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBookings, getVehicles, getDrivers } from '../supabase/db'; 

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeVehicles: 0,
    availableDrivers: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [bookings, vehicles, driversData] = await Promise.all([
          getAllBookings().catch(() => []),
          getVehicles().catch(() => []),
          getDrivers().catch(() => []) // Fallback to empty array if driver fetch errors
        ]);

        
        // Calculate high-level stats
        const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const activeVehicles = vehicles.filter(v => v.status === 'active').length;
        const availableDrivers = (driversData || []).filter(d => d.status === 'available').length;

        setStats({
          totalBookings: bookings.length,
          totalRevenue,
          activeVehicles,
          availableDrivers
        });

        // Show only the 5 most recent bookings
        const sortedBookings = [...bookings].sort((a, b) => {
          const aDate = new Date(a.createdAt || a.travelDate || 0).getTime();
          const bDate = new Date(b.createdAt || b.travelDate || 0).getTime();
          return bDate - aDate;
        });
        setRecentBookings(sortedBookings.slice(0, 5));
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading dashboard: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Revenue</span>
          <span className="text-3xl font-bold text-gray-900 mt-2">₹{stats.totalRevenue.toFixed(2)}</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Bookings</span>
          <span className="text-3xl font-bold text-blue-600 mt-2">{stats.totalBookings}</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Vehicles</span>
          <span className="text-3xl font-bold text-green-600 mt-2">{stats.activeVehicles}</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Available Drivers</span>
          <span className="text-3xl font-bold text-purple-600 mt-2">{stats.availableDrivers}</span>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</Link>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Travel Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.customerName || 'Guest'}</div>
                  <div className="text-sm text-gray-500">{booking.vehicleName || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.origin} to {booking.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{booking.amount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.bookingStatus?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.bookingStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.bookingStatus || 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
            {recentBookings.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No recent bookings.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}