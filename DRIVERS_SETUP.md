# Drivers Table Setup

## Required SQL

Run this SQL in your Supabase SQL Editor to create the drivers table:

```sql
-- Create drivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS drivers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Add optional columns if you want
-- ALTER TABLE drivers ADD COLUMN IF NOT EXISTS experience_years INT;
-- ALTER TABLE drivers ADD COLUMN IF NOT EXISTS image_url TEXT;
```

## Columns Description

- `id` - Unique identifier
- `name` - Driver's full name
- `license_number` - Driver's license number (unique)
- `phone` - Driver's contact phone
- `status` - Status (available, unavailable, on_leave, etc.)
- `created_at` - When the record was created
- `updated_at` - When the record was last updated

## Optional Columns

You can add these if needed:
- `experience_years` - Years of driving experience
- `image_url` - Profile photo URL

To add them later:
```sql
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS experience_years INT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS image_url TEXT;
```
