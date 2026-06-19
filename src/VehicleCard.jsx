import React from 'react';
import { Link } from 'react-router-dom';

export default function VehicleCard({ vehicle }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg bg-white transition-transform hover:scale-105 flex flex-col">
      <div className="relative">
        <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-48 object-cover" />
        {vehicle.ac && (
          <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
            AC
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-sm font-bold flex items-center">
          <span className="text-yellow-500 mr-1">★</span> {vehicle.rating || 'New'}
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-800">{vehicle.name}</h3>
        <p className="text-sm text-gray-500 mb-2 capitalize">{vehicle.capacity} Seater {vehicle.category}</p>
        
        <div className="mt-2 mb-4">
          <span className="text-2xl font-bold text-gray-900">₹{vehicle.pricePerDay}</span>
          <span className="text-sm text-gray-500"> per day</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {vehicle.capacity} Seats &bull; {vehicle.reviews || 0} reviews
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
            {Array.isArray(vehicle.features) && vehicle.features.map((feature, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                {feature}
              </span>
            ))}
        </div>

        <Link to={`/book/${vehicle.id}`} className="mt-auto w-full">
          <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold">
            Book Now
          </button>
        </Link>
      </div>
    </div>
  );
}