import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Car, DollarSign, BarChart2, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: DollarSign },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/tours', label: 'Tours', icon: Car },
  { href: '/admin/sponsors', label: 'Sponsors', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            <span className="font-bold text-lg text-gray-800">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-200">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet /> {/* This is where the nested admin pages will render */}
      </main>
    </div>
  );
}