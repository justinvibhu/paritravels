import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BookingSuccessPage() {
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Booking Successful!</h1>
          <p className="text-gray-600 mt-2">
            Thank you, {booking?.customerName || 'customer'}! Your booking has been confirmed. We will contact you shortly with more details.
          </p>
          {booking && (
            <div className="text-left bg-gray-50 p-4 rounded-md mt-6 border">
              <h3 className="font-semibold text-gray-800">Booking Summary</h3>
              <p className="text-sm text-gray-600 mt-2"><strong>Booking ID:</strong> {booking.bookingId || booking.id}</p>
              <p className="text-sm text-gray-600"><strong>Vehicle:</strong> {booking.vehicleName}</p>
              <p className="text-sm text-gray-600"><strong>Vehicle Number:</strong> {booking.vehicleNumber || booking.vehicle_number || 'N/A'}</p>
              {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                <p className="text-sm text-gray-600"><strong>Seats:</strong> {booking.seatNumbers.join(', ')}</p>
              )}
              <p className="text-sm text-gray-600"><strong>Travel Date:</strong> {new Date(booking.travelDate).toLocaleDateString()}</p>
            </div>
          )}
          <div className="mt-8">
            <Link to="/fleet" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-semibold">
              Back to Fleet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}