import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VehicleCard from './VehicleCard';

const API_URL = "http://localhost:5000/api";

export default function HomePage() {
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedVehicles = async () => {
      try {
        // Fetch active vehicles from the backend database
        const response = await fetch(`${API_URL}/vehicles?status=active`, {
          cache: 'no-store', // Force the browser to not cache this request
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch vehicles.');
        }
        const data = await response.json();
        
        // Show only the top 3 featured vehicles on the home page
        setFeaturedVehicles(data.slice(0, 3));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedVehicles();
  }, []);

  return (
    <div className="font-sans text-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">Experience Luxury Travel</h1>
          <p className="text-xl md:text-2xl mb-10 opacity-90 font-light max-w-3xl mx-auto">Discover our premium fleet of vehicles and unforgettable tours. Your perfect journey awaits with Pari Travels.</p>
          <Link to="/fleet" className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition shadow-2xl inline-block">
            Explore Our Fleet
          </Link>
        </div>
      </div>

      {/* Featured Vehicles Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-blue-600 font-semibold uppercase tracking-wider">Premium Selection</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Featured Vehicles</h2>
          </div>
          <Link to="/fleet" className="text-blue-600 hover:text-blue-800 font-semibold hidden sm:block">View All Fleet &rarr;</Link>
        </div>

        {loading ? (
          <p className="text-center py-10">Loading featured vehicles...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-10">Error: {error}</p>
        ) : featuredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-lg">
            <p>No vehicles are currently available for booking. Please check back later.</p>
          </div>
        )}
        
        <div className="mt-8 text-center sm:hidden">
          <Link to="/fleet" className="text-blue-600 hover:text-blue-800 font-semibold">View All Fleet &rarr;</Link>
        </div>
      </div>
    </div>
  );
}