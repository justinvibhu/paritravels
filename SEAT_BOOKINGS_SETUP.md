# Seat Bookings Setup Guide

## Database Schema

Run these SQL queries in your Supabase dashboard (SQL Editor) to set up seat management:

### 1. Create seat_bookings table

```sql
CREATE TABLE seat_bookings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_number INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL, -- e.g., "1", "2", "A1", "B2"
  passenger_name VARCHAR(255),
  booked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_id, booking_id, seat_number)
);

CREATE INDEX idx_seat_bookings_vehicle_id ON seat_bookings(vehicle_id);
CREATE INDEX idx_seat_bookings_booking_id ON seat_bookings(booking_id);
```

### 2. Update vehicles table (if needed)

Add `capacity` column if it doesn't exist:

```sql
ALTER TABLE vehicles ADD COLUMN capacity INT DEFAULT 50;
```

### 3. Add seat_labels to vehicles (optional)

For future use - stores seat layout as JSON:

```sql
ALTER TABLE vehicles ADD COLUMN seat_labels JSONB DEFAULT '[]';
```

## How It Works

1. **Customer Books Seats:**
   - Customer selects vehicle and date
   - UI shows available seats (not in seat_bookings for that date)
   - Customer selects seat(s)
   - Seats added to seat_bookings table linked to booking_id

2. **Admin Manages Seats:**
   - Admin views vehicle seat map showing booked/available
   - Can delete seat bookings to free up seats
   - Can see passenger details per seat

3. **Seat Availability:**
   - Seats queried from seat_bookings for specific vehicle + date
   - Available seats = total capacity - booked seats
