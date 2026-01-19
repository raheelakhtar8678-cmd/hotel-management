-- Migration: Add amenities and image_url fields to rooms and properties tables
-- Run this SQL in your Neon/Vercel Postgres database

-- Add amenities column to rooms (stores JSON string of amenity IDs)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities TEXT;

-- Add image_url column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_url TEXT;
