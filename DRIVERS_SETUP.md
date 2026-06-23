# Drivers Table Setup

## Required SQL

Run this SQL in your Supabase SQL Editor to create the drivers table:

```sql
-- Create drivers table if it doesn't exist
-- Drop the table if it exists to ensure a clean setup with the correct schema.
-- WARNING: This will delete all existing data in the drivers table.
DROP TABLE IF EXISTS public.drivers;

CREATE TABLE public.drivers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  phone text,
  license_number text UNIQUE NOT NULL,
  experience_years integer,
  status text DEFAULT 'available'::text,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
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
