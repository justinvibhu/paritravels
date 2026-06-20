# Seat Management Implementation Summary

## Overview
Implemented complete seat booking and management system for vehicle bookings. Customers can now select specific seats during booking, and admins can manage seat availability and see which seats are booked.

## Database Setup (REQUIRED - Do this first!)

Run these SQL queries in your Supabase SQL Editor:

```sql
-- 1. Create seat_bookings table
CREATE TABLE seat_bookings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_number INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL,
  passenger_name VARCHAR(255),
  booked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_id, booking_id, seat_number)
);

-- 2. Create indexes for faster queries
CREATE INDEX idx_seat_bookings_vehicle_id ON seat_bookings(vehicle_id);
CREATE INDEX idx_seat_bookings_booking_id ON seat_bookings(booking_id);

-- 3. Add capacity column to vehicles (if not exists)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 50;
```

## Implementation Details

### Backend APIs (`/backend/index.js`)

**1. Get Available Seats for a Vehicle**
```
GET /api/vehicles/:id/seats?date=YYYY-MM-DD
```
Returns available and booked seats for a specific vehicle and date.

**2. Book Seats**
```
POST /api/seat-bookings
Body: {
  vehicleId: number,
  bookingId: number,
  seatNumbers: [1, 2, 3],
  passengerName: string
}
```

**3. Admin: View All Seat Bookings for a Vehicle**
```
GET /api/admin/vehicles/:id/seats
```
Shows booked seats with customer and booking details.

**4. Admin: Delete/Remove a Seat Booking**
```
DELETE /api/seat-bookings/:id
```
Frees up a seat for rebooking.

### Frontend Components

**1. SeatSelector Component** (`src/components/SeatSelector.jsx`)
- Displays seat grid (4 columns by default)
- Shows available seats (green), booked seats (red), and selected seats (blue)
- Fetches real-time availability for vehicle + date
- Allows customer to select multiple seats
- Color-coded UI: 
  - Green = Available
  - Red = Booked (disabled)
  - Blue = Selected by customer

**2. Updated BookingPage** (`src/BookingPage.jsx`)
- Imported SeatSelector component
- Added seat selection after date selection
- When booking is created, seats are automatically booked via POST /api/seat-bookings
- Shows seat availability below the booking form

**3. Admin Seat Management** (`src/admin/SeatManagement.jsx`)
- Vehicle selector dropdown
- Real-time seat status display with capacity info
- Table showing all booked seats with:
  - Seat number
  - Passenger name
  - Booking ID
  - Customer details
  - Travel date
  - Booking status
  - Remove button to free up seats
- Admin can delete seat bookings to make seats available again

### Navigation Updates

**Updated Files:**
- `src/admin/AdminLayout.jsx` - Added "Seat Management" to sidebar menu
- `src/main.tsx` - Added import for AdminSeatManagement and route `/admin/seats`

## User Flows

### Customer Booking Flow
1. Customer fills in booking details (name, email, phone, pickup, dropoff)
2. Selects travel date
3. **SeatSelector appears** showing available seats for that date
4. Customer selects desired seats (can select multiple)
5. Clicks "Confirm Booking"
6. Backend creates booking and automatically books selected seats
7. Seats become unavailable for other customers

### Admin Management Flow
1. Admin navigates to "Seat Management" in admin panel
2. Selects a vehicle from dropdown
3. Sees all booked seats with passenger info
4. Can click "Remove" to free up specific seats for rebooking
5. Seat availability updates in real-time

## Features

✅ **Real-time Seat Availability** - Seats fetch data based on vehicle + date combination
✅ **Visual Seat Map** - Grid-based interface for easy selection
✅ **Auto-booking** - Seats automatically reserved when customer completes booking
✅ **Admin Control** - Can view and remove seat bookings
✅ **Passenger Tracking** - Admin can see who booked which seat
✅ **Booking Details** - Links seat bookings to customer and booking info

## Files Created/Modified

**Created:**
- `src/components/SeatSelector.jsx` - Seat selection UI
- `src/admin/SeatManagement.jsx` - Admin seat management page
- `SEAT_BOOKINGS_SETUP.md` - Setup instructions

**Modified:**
- `backend/index.js` - Added 4 new seat booking APIs
- `src/BookingPage.jsx` - Added SeatSelector component and seat booking logic
- `src/admin/AdminLayout.jsx` - Added Seat Management nav item
- `src/main.tsx` - Added route for seat management page

## Next Steps

1. **Run the SQL setup** (see Database Setup above)
2. Update vehicles with `capacity` values if not already set
3. Test the seat selection flow by:
   - Creating a booking with seat selection
   - Verifying seats appear as booked in admin panel
   - Testing seat removal/freeing up

## Technical Notes

- Seats are tied to specific dates (same vehicle can have different seats booked on different dates)
- Seat numbers are stored as integers (1, 2, 3...) and displayed as strings
- Seat bookings are automatically deleted when a booking is deleted (CASCADE)
- Admin API includes full booking details via foreign key join
