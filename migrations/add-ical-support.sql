-- Add iCal column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ical_url TEXT;

-- Add external booking tracking to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Create an index to quickly check for duplicates
CREATE INDEX IF NOT EXISTS idx_bookings_external_id ON bookings(external_id);
