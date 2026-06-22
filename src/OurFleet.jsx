import React, { useState, useEffect } from 'react';
import VehicleCard from './VehicleCard'; // Import the new component

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function OurFleet() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveVehicles = async () => {
      try {
        // Fetch only 'active' vehicles for the public site
        const response = await fetch(`${API_URL}/vehicles?status=active`, {
          cache: 'no-store', // Force the browser to not cache this request
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch available vehicles.');
        }
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVehicles();
  }, []);

  if (loading) return <p className="text-center p-8">Loading our fleet...</p>;
  if (error) return <p className="text-center p-8 text-red-500">Error: {error}</p>;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-blue-600 font-semibold uppercase tracking-wider">Our Fleet</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">All Available Vehicles</h2>
          </div>
        </div>
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-16">
            <p>No vehicles are currently available for booking. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}