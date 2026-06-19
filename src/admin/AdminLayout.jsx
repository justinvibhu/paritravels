import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Dashboard", path: "/admin" },
  { name: "Bookings", path: "/admin/bookings" },
  { name: "Customers", path: "/admin/customers" },
  { name: "Drivers", path: "/admin/drivers" },
  { name: "Tours", path: "/admin/tours" },
  { name: "Vehicles", path: "/admin/vehicles" },
  // Add other items like Vehicles, Reports etc. here
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-100 font-sans text-gray-500 font-medium">Loading admin panel...</div>;
  }

  if (!currentUser || userData?.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 font-sans px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You do not have permission to view the admin dashboard. Please log in with an administrator account.</p>
          <button 
            onClick={() => window.location.href = "/"} 
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isActiveNavItem = (item) => {
    if (item.path === "/") {
      return pathname === item.path;
    }
    return pathname === item.path || pathname.startsWith(item.path + "/");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="py-4 flex flex-col justify-center px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">Admin Panel</h2>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Super Administrator</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link to={item.path} className={`block px-6 py-3 text-sm font-medium transition-colors ${isActiveNavItem(item) ? "bg-blue-50 text-blue-700 border-r-4 border-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3 truncate px-2">{currentUser?.email}</p>
          <button onClick={handleLogout} className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 hover:text-red-600 transition">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}