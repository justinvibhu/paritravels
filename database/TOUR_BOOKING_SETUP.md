# Tour Booking Database Setup Guide

## Overview
This document explains all the database modifications needed for the tour booking feature in Pari Travels.

## Changes to Existing Tables

### 1. BOOKINGS TABLE (Modified)
Add these columns to support both vehicle and tour bookings:

```sql
-- Column                    | Type                  | Purpose
booking_type               TEXT DEFAULT 'vehicle'   -- 'vehicle' or 'tour'
tour_id                    BIGINT                  -- References tours.id
tour_name                  TEXT                    -- Tour package name
price_per_person           NUMERIC                 -- Price per passenger
special_requests           TEXT                    -- Customer special needs
email                      TEXT                    -- Customer email
phone                      TEXT                    -- Customer phone
```

**Complete Column List (Bookings Table):**
```
- id (BIGINT) - Primary key
- created_at (TIMESTAMP WITH TIME ZONE)
- user_id (UUID)
- customer_name (TEXT)
- origin (TEXT) - Pickup location
- destination (TEXT) - Dropoff location / Tour destination
- travel_date (DATE)
- vehicle_name (TEXT) - Vehicle name (NULL for tour bookings)
- seat_numbers (ARRAY)
- passengers (INTEGER)
- amount (NUMERIC) - Total booking amount
- payment_method (TEXT)
- payment_status (TEXT) - 'Pending', 'Paid', 'Failed'
- booking_status (TEXT) - 'Pending', 'Confirmed', 'Cancelled'
- booking_id (UUID)
- amount_text (TEXT)
- driver_id (BIGINT)
- booking_type (TEXT) - NEW: 'vehicle' or 'tour'
- tour_id (BIGINT) - NEW: Foreign key to tours
- tour_name (TEXT) - NEW: Tour name
- price_per_person (NUMERIC) - NEW: Per-person price
- special_requests (TEXT) - NEW: Special requests
- email (TEXT) - NEW: Customer email
- phone (TEXT) - NEW: Customer phone
```

### 2. TOURS TABLE (Enhanced)
Add these optional columns for better tour information:

```sql
-- Column                    | Type      | Purpose
category                   TEXT          -- 'beach', 'hills', 'spiritual', 'adventure'
rating                     NUMERIC       -- Average rating (0-5)
reviews                    INTEGER       -- Number of reviews
destination                TEXT          -- Main destination name
```

## Step-by-Step Migration

### Step 1: Run the Main Migration SQL
Copy and execute `tour-booking-migration.sql` in Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content of `tour-booking-migration.sql`
4. Execute

### Step 2: Verify Changes
Run this query to verify all columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

### Step 3: Check Indexes Created
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'bookings'
AND indexname LIKE 'idx_%';
```

## Data Relationships

### Vehicle Booking Record
```json
{
  "booking_type": "vehicle",
  "vehicle_name": "Toyota Fortuner",
  "origin": "Mumbai",
  "destination": "Pune",
  "seat_numbers": [1, 2, 3],
  "driver_id": 5,
  "amount": 5000,
  "special_requests": null
}
```

### Tour Booking Record
```json
{
  "booking_type": "tour",
  "tour_id": 12,
  "tour_name": "Goa Beach Escape",
  "destination": "Goa",
  "travel_date": "2026-07-15",
  "passengers": 4,
  "amount": 24000,
  "price_per_person": 6000,
  "special_requests": "Vegetarian meals preferred",
  "driver_id": null,
  "email": "customer@example.com",
  "phone": "+919876543210"
}
```

## Indexes Created

These indexes improve query performance:

```sql
idx_bookings_booking_type       -- Filter bookings by type
idx_bookings_tour_id            -- Find bookings for a tour
idx_bookings_customer_email     -- Find customer bookings by email
idx_bookings_booking_id         -- Quick lookup by booking_id
```

## View Created

### tour_bookings_summary
Shows all tour bookings with related tour information:

```sql
SELECT * FROM tour_bookings_summary;

-- Returns columns:
-- id, booking_id, tour_id, tour_name, customer_name, email, phone,
-- passengers, travel_date, amount, price_per_person, payment_status,
-- booking_status, special_requests, created_at, destination, duration_days,
-- tour_base_price
```

## Sample Queries

### Get All Tour Bookings
```sql
SELECT * FROM bookings WHERE booking_type = 'tour' ORDER BY created_at DESC;
```

### Get Vehicle Bookings
```sql
SELECT * FROM bookings WHERE booking_type = 'vehicle' ORDER BY created_at DESC;
```

### Get Bookings by Customer Email
```sql
SELECT * FROM bookings WHERE email = 'customer@example.com';
```

### Get Tour Bookings for Specific Tour
```sql
SELECT * FROM bookings 
WHERE booking_type = 'tour' AND tour_id = 5
ORDER BY travel_date;
```

### Get Revenue by Type
```sql
SELECT 
  booking_type,
  COUNT(*) as total_bookings,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_amount
FROM bookings
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY booking_type;
```

### Get Pending Confirmations
```sql
SELECT * FROM tour_bookings_summary
WHERE payment_status = 'Pending'
ORDER BY created_at DESC;
```

## Troubleshooting

### If "Column already exists" error
The `IF NOT EXISTS` clause should prevent this, but if it occurs:
1. Check current column structure: `SELECT * FROM information_schema.columns WHERE table_name='bookings';`
2. Skip already-existing columns
3. Continue with remaining additions

### If Foreign Key Creation Fails
Ensure `tours` table exists with `id` column. Run:
```sql
SELECT * FROM tours LIMIT 1;
```

### If Indexes Fail to Create
They may already exist. Check:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'bookings';
```

## Rollback (If Needed)

If you need to revert changes:
```sql
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_type;
ALTER TABLE bookings DROP COLUMN IF EXISTS tour_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS tour_name;
ALTER TABLE bookings DROP COLUMN IF EXISTS price_per_person;
ALTER TABLE bookings DROP COLUMN IF EXISTS special_requests;
ALTER TABLE bookings DROP COLUMN IF EXISTS email;
ALTER TABLE bookings DROP COLUMN IF EXISTS phone;

DROP VIEW IF EXISTS tour_bookings_summary;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_tour_id;
```

## Frontend Integration

The app already has:
- ✅ TourBookingPage.jsx - Booking form
- ✅ API endpoints - /api/tour-bookings
- ✅ Admin panel - BookingsManagement.jsx with filters
- ✅ Database functions - db.ts with tour booking functions

Just run the migration queries and the app will work seamlessly!
