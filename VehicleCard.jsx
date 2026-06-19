import React from 'react';
import { Users, Star } from 'lucide-react'; // Assuming lucide-react is used

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function VehicleCard({ vehicle }) {
  // Default values to prevent errors if vehicle data is incomplete
  const safeVehicle = {
    name: 'Unnamed Vehicle',
    type: 'N/A',
    capacity: 0,
    pricePerDay: 0,
    reviews: 0,
    rating: 0,
    features: [],
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=480&h=300&fit=crop&auto=format',
    ...vehicle,
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="relative h-48 bg-blue-100 overflow-hidden">
        <img src={safeVehicle.imageUrl} alt={safeVehicle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {safeVehicle.ac && (
            <div className="absolute top-3 left-3">
                <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">AC</span>
            </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold">{safeVehicle.rating}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{safeVehicle.name}</h3>
            <p className="text-blue-500 text-sm font-medium">{safeVehicle.type}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-blue-700 font-black text-lg">{formatCurrency(safeVehicle.pricePerDay)}</div>
            <div className="text-gray-400 text-xs">per day</div>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-3 text-gray-500 text-xs">
          <Users size={12} /> {safeVehicle.capacity} Seats &nbsp;·&nbsp; {safeVehicle.reviews} reviews
        </div>
        <div className="flex flex-wrap gap-1 mb-4 flex-grow content-start">
          {safeVehicle.features?.slice(0, 4).map((feature) => (
            <span key={feature} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {feature}
            </span>
          ))}
        </div>
        <button className="mt-auto w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
          Book Now
        </button>
      </div>
    </div>
  );
}