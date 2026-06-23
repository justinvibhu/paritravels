import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BookingSuccessPage() {
  const location = useLocation();
  const booking = location.state?.booking;
  const tour = location.state?.tour;
  const bookingType = location.state?.bookingType || (booking && (booking.tourName || booking.tour_name) ? 'tour' : 'vehicle');

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Show a success toast for 4 seconds on mount
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const execPhone = (tour && (tour.contactPhone || tour.phone || tour.mobile)) || booking?.executivePhone || '+918626048673';

  // Safe booking fields with fallbacks to avoid runtime errors when state is empty
  const displayBookingId = booking?.bookingId || booking?.id || 'N/A';
  const displayTourName = booking?.tourName || booking?.tour_name || tour?.name || 'N/A';
  const displayPassengers = booking?.passengers ?? 'N/A';
  const displayDate = booking?.startDate || booking?.travelDate || null;
  const displayAmount = booking?.amount ?? 'N/A';

  return (
    <div className="bg-gray-50 py-16 min-h-screen">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Booking Successful!</h1>
          <p className="text-gray-600 mt-2">
            Thank you, {booking?.customerName || 'customer'}! Your booking has been confirmed. We will contact you shortly with more details.
          </p>

          {booking ? (
            bookingType === 'tour' ? (
              <div className="text-left bg-gray-50 p-4 rounded-md mt-6 border">
                <h3 className="font-semibold text-gray-800">Tour Booking Summary</h3>
                <p className="text-sm text-gray-600 mt-2"><strong>Booking ID:</strong> {displayBookingId}</p>
                <p className="text-sm text-gray-600"><strong>Tour:</strong> {displayTourName}</p>
                <p className="text-sm text-gray-600"><strong>Passengers:</strong> {displayPassengers}</p>
                <p className="text-sm text-gray-600"><strong>Start Date:</strong> {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Amount:</strong> {displayAmount}</p>
              </div>
            ) : (
              <div className="text-left bg-gray-50 p-4 rounded-md mt-6 border">
                <h3 className="font-semibold text-gray-800">Booking Summary</h3>
                <p className="text-sm text-gray-600 mt-2"><strong>Booking ID:</strong> {displayBookingId}</p>
                <p className="text-sm text-gray-600"><strong>Vehicle:</strong> {booking.vehicleName || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Vehicle Number:</strong> {booking.vehicleNumber || booking.vehicle_number || 'N/A'}</p>
                {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                  <p className="text-sm text-gray-600"><strong>Seats:</strong> {booking.seatNumbers.join(', ')}</p>
                )}
                <p className="text-sm text-gray-600"><strong>Travel Date:</strong> {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            )
          ) : (
            <div className="text-left bg-gray-50 p-4 rounded-md mt-6 border">
              <h3 className="font-semibold text-gray-800">Booking Info</h3>
              <p className="text-sm text-gray-600 mt-2">We couldn't find booking details. If you just submitted, please refresh or check your bookings in the Dashboard.</p>
              <p className="text-sm text-gray-600 mt-1">If the issue persists, contact support: <a href="tel:+918626048673" className="text-blue-600">+91 86260 48673</a></p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/tours" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-semibold">
              Back to Tours
            </Link>

            {/* Call Tour Executive button (uses tel: link) */}
            {bookingType === 'tour' && (
              <a href={`tel:${execPhone}`} className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition font-semibold">
                Call Tour Executive
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Simple toast popup */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-white border p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <div>
            <div className="font-semibold">Booking confirmed</div>
            <div className="text-sm text-gray-600">We've sent your booking details. Need help? Call the tour executive.</div>
          </div>
        </div>
      )}
    </div>
  );
}