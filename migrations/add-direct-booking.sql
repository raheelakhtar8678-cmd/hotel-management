-- Migration: Add slug to properties and booking_inquiries table
-- Run this in your Neon SQL Editor

-- Add slug column to properties (for URL-friendly names)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Add owner_email to properties (for inquiry notifications)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);

-- Create booking_inquiries table
CREATE TABLE IF NOT EXISTS booking_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, declined
    notes TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON booking_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON booking_inquiries(status);

-- Generate slugs for existing properties (name to lowercase, replace spaces with dashes)
UPDATE properties 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
