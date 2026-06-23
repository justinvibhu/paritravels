import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, DollarSign, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function TourBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tour = location.state?.tour;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    passengers: 1,
    startDate: '',
    specialRequests: '',
  });

  useEffect(() => {
    if (!tour) {
      setError('No tour selected. Please select a tour first.');
      setTimeout(() => navigate('/tours'), 2000);
    }
  }, [tour, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tour) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.customerName || !formData.email || !formData.phone || !formData.startDate) {
        throw new Error('Please fill in all required fields');
      }

      // Calculate total amount
      const totalAmount = tour.price * Number(formData.passengers);

      const payload = {
        tourId: tour.id,
        tourName: tour.name,
        destination: tour.dest || tour.destination,
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        passengers: Number(formData.passengers),
        startDate: formData.startDate,
        duration: tour.duration,
        amount: totalAmount,
        pricePerPerson: tour.price,
        specialRequests: formData.specialRequests,
        bookingType: 'tour',
        paymentStatus: 'Pending',
        bookingStatus: 'Confirmed',
      };

      const response = await fetch(`${API_URL}/tour-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to create tour booking.';
        
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } else {
          // Response is HTML or other non-JSON format
          const text = await response.text();
          errorMessage = `API Error (${response.status}): ${text.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const newBooking = await response.json();

      // Navigate to success page with booking details
      navigate('/booking-success', { state: { booking: newBooking, bookingType: 'tour', tour } });

    } catch (err) {
      setError(err.message);
      console.error('Booking error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No tour selected</h2>
          <p className="text-gray-600 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold text-center mb-2">Book Your Tour</h1>
        <p className="text-center text-gray-600 mb-12">Complete your tour booking details below</p>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tour Details Column */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{tour.name}</h2>
            
            <div className="mb-6 rounded-lg overflow-hidden">
              <img 
                src={tour.img || tour.imageUrl || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=480&h=300&fit=crop&auto=format'} 
                alt={tour.name} 
                className="w-full h-64 object-cover" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-semibold text-gray-900">{tour.dest || tour.destination}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{tour.duration}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Price per Person</p>
                  <p className="font-semibold text-green-600 text-lg">₹{tour.price?.toLocaleString()}</p>
                </div>
              </div>

              {tour.includes && tour.includes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Includes</p>
                  <div className="space-y-2">
                    {tour.includes.map((inc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check size={16} className="text-green-600" />
                        {inc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form Column */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Tour Booking Details</h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Name */}
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  id="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Number of Passengers */}
              <div>
                <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Passengers *
                </label>
                <input
                  type="number"
                  name="passengers"
                  id="passengers"
                  value={formData.passengers}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="20"
                  placeholder="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 20 passengers per booking</p>
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  placeholder="Any special requests or dietary preferences..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              {/* Price Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Price per person</span>
                  <span className="font-semibold">₹{tour.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700">Number of passengers</span>
                  <span className="font-semibold">{formData.passengers}</span>
                </div>
                <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{(tour.price * Number(formData.passengers)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Complete Booking'}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By clicking Complete Booking, you agree to our terms and conditions
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
