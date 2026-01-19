-- Migration: Add amenities and images fields to rooms and properties tables
-- Run this SQL in your Neon/Vercel Postgres database

-- Add amenities column to rooms (stores JSON string of amenity IDs)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities TEXT;

-- Add images column to rooms (stores JSON array of image URLs - up to 5)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS images TEXT;

-- Add images column to properties (stores JSON array of image URLs - up to 5)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT;

-- Optional: Remove old image_url column if it exists (uncomment if needed)
-- ALTER TABLE rooms DROP COLUMN IF EXISTS image_url;
-- ALTER TABLE properties DROP COLUMN IF EXISTS image_url;
