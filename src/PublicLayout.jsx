import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="font-sans">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Pari Travels
          </Link>
          <div>
            <Link to="/fleet" className="text-gray-600 hover:text-blue-600 px-3 py-2">Our Fleet</Link>
            <Link to="/tours" className="text-gray-600 hover:text-blue-600 px-3 py-2">Tours</Link>
            <Link to="/contact" className="text-gray-600 hover:text-blue-600 px-3 py-2">Contact</Link>
            <Link to="/admin" className="ml-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition">
              Admin Login
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-6 py-8 text-center">
          <p>&copy; {new Date().getFullYear()} Pari Travels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}