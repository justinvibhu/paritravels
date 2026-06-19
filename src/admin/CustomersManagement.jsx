import React, { useState, useEffect } from "react";
import { getUsers, getAllBookings } from "../supabase/db";

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fetch registered users and all bookings simultaneously
      const [usersData, bookingsData] = await Promise.all([
        getUsers().catch(() => []),
        getAllBookings().catch(() => [])
      ]);

      const customerMap = {};

      // 1. Add all registered users
      usersData.forEach(u => {
        const email = u.email || u.user_email;
        if (email) {
          customerMap[email] = {
            name: u.fullName || u.full_name || "Unknown",
            email: email,
            phone: u.mobile || u.phone || "N/A",
            role: u.role || "customer",
            totalBookings: 0,
            totalSpent: 0,
            isRegistered: true,
            joinDate: u.createdAt || u.created_at || null
          };
        }
      });

      // 2. Aggregate booking history for both registered & guest users
      bookingsData.forEach(b => {
        const email = b.userEmail || b.email;
        const name = b.customerName;
        const phone = b.customerPhone || b.phone || "N/A";
        const amount = Number(b.amount) || 0;

        const key = email || name;
        if (!key) return;

        if (!customerMap[key]) {
          customerMap[key] = {
            name: name || "Guest",
            email: email || "N/A",
            phone: phone,
            role: "guest",
            totalBookings: 0,
            totalSpent: 0,
            isRegistered: false,
            joinDate: null
          };
        }

        customerMap[key].totalBookings += 1;
        customerMap[key].totalSpent += amount;
      });

      setCustomers(Object.values(customerMap));
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customer profiles.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading customers...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (c.phone || "").includes(searchTerm)
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Customers Management</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lifetime Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {(c.name || "G")[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {c.name || "Guest"}
                        {c.role === "admin" && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wide">Admin</span>}
                      </div>
                      {c.joinDate && <div className="text-xs text-gray-500">Joined {new Date(c.joinDate).toLocaleDateString()}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{c.email !== "N/A" ? c.email : "—"}</div>
                  <div className="text-sm text-gray-500">{c.phone !== "N/A" ? c.phone : "—"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {c.isRegistered ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Registered</span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Guest</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{c.totalBookings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  ₹{c.totalSpent.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No customers match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}