import React from 'react';

export default function TourCard({ tour }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg bg-white transition-transform hover:scale-105 flex flex-col">
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{tour.name}</h3>
          <span className="text-lg font-semibold text-blue-600">₹{tour.price}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {tour.durationDays} {tour.durationDays > 1 ? 'Days' : 'Day'}
        </p>
        <p className="text-gray-600 text-sm mb-6 flex-grow">
          {tour.description}
        </p>
        <button className="mt-auto w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
          View Details
        </button>
      </div>
    </div>
  );
}