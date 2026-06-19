import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:5000/api";

export default function BookingPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    origin: '',
    destination: '',
    travelDate: '',
    passengers: 1,
  });

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/vehicles/${vehicleId}`);
        if (!response.ok) {
          throw new Error('Vehicle not found.');
        }
        const data = await response.json();
        setVehicle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicle) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        origin: formData.origin || 'TBD',
        destination: formData.destination || 'TBD',
        travelDate: formData.travelDate,
        passengers: Number(formData.passengers),
        vehicleName: vehicle.name,
        amount: vehicle.pricePerDay,
      };

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create booking.');
      }

      const newBooking = await response.json();
      // Navigate to a success page with the new booking details
      navigate('/booking-success', { state: { booking: newBooking } });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-12">Loading vehicle details...</div>;
  if (error) return <div className="text-center p-12 text-red-500">Error: {error}</div>;
  if (!vehicle) return <div className="text-center p-12">Vehicle not found.</div>;

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold text-center mb-8">Book Your Ride</h1>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-lg shadow-lg">
          {/* Vehicle Details Column */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{vehicle.name}</h2>
            <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-64 object-cover rounded-lg mb-4" />
            <p className="text-gray-600 capitalize">{vehicle.capacity} Seater {vehicle.category}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold">₹{vehicle.pricePerDay}</span>
              <span className="text-gray-500"> / day</span>
            </div>
          </div>

          {/* Booking Form Column */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Enter Your Details</h3>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="customerName" id="customerName" value={formData.customerName} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700">Pickup Location</label>
                <input type="text" name="origin" id="origin" value={formData.origin} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                <input type="text" name="destination" id="destination" value={formData.destination} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="passengers" className="block text-sm font-medium text-gray-700">Number of Passengers</label>
                <input type="number" name="passengers" id="passengers" value={formData.passengers} onChange={handleInputChange} required min="1" max={vehicle.capacity} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="travelDate" className="block text-sm font-medium text-gray-700">Travel Date</label>
                <input type="date" name="travelDate" id="travelDate" value={formData.travelDate} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" min={new Date().toISOString().split('T')[0]} />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold disabled:opacity-50">
                {isSubmitting ? 'Processing...' : `Confirm Booking for ₹${vehicle.pricePerDay}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}