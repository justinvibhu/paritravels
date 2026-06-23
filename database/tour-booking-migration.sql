-- ============================================
-- TOUR BOOKING DATABASE SETUP QUERIES
-- ============================================

-- 1. ADD MISSING COLUMNS TO BOOKINGS TABLE
-- (These columns support both vehicle and tour bookings)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'vehicle';
-- Values: 'vehicle' or 'tour'

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tour_id BIGINT;
-- Foreign key to tours table

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tour_name TEXT;
-- Name of the tour package

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_per_person NUMERIC;
-- Price per individual passenger (for tour bookings)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
-- Customer special requests or dietary preferences

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email TEXT;
-- Customer email address

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT;
-- Customer phone number

-- 2. ADD FOREIGN KEY CONSTRAINT FOR TOUR BOOKINGS (if not exists)
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS fk_bookings_tour_id;

ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_tour_id 
FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL;

-- 3. CREATE INDEX FOR FASTER QUERIES
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);

-- 4. UPDATE TOURS TABLE (if needed)
ALTER TABLE tours ADD COLUMN IF NOT EXISTS category TEXT;
-- Category like 'beach', 'spiritual', 'hills', 'adventure', etc.

ALTER TABLE tours ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8;
-- Average rating

ALTER TABLE tours ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
-- Number of reviews

ALTER TABLE tours ADD COLUMN IF NOT EXISTS destination TEXT;
-- Main destination name

-- 5. CREATE TOUR_BOOKING_SUMMARY VIEW (for admin dashboard)
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
  t.duration_days,
  t.price as tour_base_price
FROM bookings b
LEFT JOIN tours t ON b.tour_id = t.id
WHERE b.booking_type = 'tour'
ORDER BY b.created_at DESC;

-- 6. SAMPLE DATA (Optional - for testing)
-- Insert a sample tour booking
-- INSERT INTO bookings (
--   booking_id,
--   booking_type,
--   tour_id,
--   tour_name,
--   customer_name,
--   email,
--   phone,
--   passengers,
--   travel_date,
--   destination,
--   amount,
--   price_per_person,
--   payment_status,
--   booking_status,
--   special_requests,
--   created_at
-- ) VALUES (
--   'PT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
--   'tour',
--   1,
--   'Goa Beach Escape',
--   'Raj Kumar',
--   'raj@example.com',
--   '+919876543210',
--   4,
--   '2026-07-15',
--   'Goa',
--   24000,
--   6000,
--   'Pending',
--   'Confirmed',
--   'Vegetarian meals preferred',
--   NOW()
-- );

-- 7. GRANT PERMISSIONS (if using row-level security)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
-- GRANT SELECT ON tours TO authenticated;
