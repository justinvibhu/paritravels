import React, { useState, useEffect } from 'react';
import TourCard from './TourCard';

const API_URL = "http://localhost:5000/api";

export default function ToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveTours = async () => {
      try {
        const response = await fetch(`${API_URL}/tours?active=true`);
        if (!response.ok) throw new Error('Failed to fetch available tours.');
        const data = await response.json();
        setTours(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTours();
  }, []);

  if (loading) return <p className="text-center p-8">Loading tours...</p>;
  if (error) return <p className="text-center p-8 text-red-500">Error: {error}</p>;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Our Tours</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map(tour => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </div>
  );
}