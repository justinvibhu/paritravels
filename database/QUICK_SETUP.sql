-- ============================================
-- QUICK TOUR BOOKING DATABASE SETUP
-- Copy and paste all queries below into Supabase SQL Editor
-- ============================================

-- Step 1: Add columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'vehicle';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tour_id BIGINT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tour_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_per_person NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add driver assignment to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_id BIGINT;


-- Step 2: Add foreign key
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS fk_bookings_tour_id;

ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_tour_id 
FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);

-- Vehicles driver foreign key and index
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_driver_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_driver_id FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);

-- Step 4: Enhance tours table (optional but recommended)
ALTER TABLE tours ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS destination TEXT;

-- Step 5: Create useful view for admin dashboard
CREATE OR REPLACE VIEW tour_bookings_summary AS
SELECT 
  b.id,
  b.booking_id,
  b.tour_id,
  b.tour_name,
  b.customer_name,
  b.email,
  b.phone,
  b.passengers,
  b.travel_date,
  b.amount,
  b.price_per_person,
  b.payment_status,
  b.booking_status,
  b.special_requests,
  b.created_at,
  t.destination,
  t.duration_days
FROM bookings b
LEFT JOIN tours t ON b.tour_id = t.id
WHERE b.booking_type = 'tour'
ORDER BY b.created_at DESC;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify all columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings'
AND column_name IN ('booking_type', 'tour_id', 'tour_name', 'price_per_person', 'special_requests', 'email', 'phone')
ORDER BY column_name;

-- Verify indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'bookings'
AND indexname LIKE 'idx_bookings%';

-- Verify view was created
SELECT * FROM tour_bookings_summary LIMIT 5;
