-- Migration: Enhanced Public Booking System
-- Run this in Neon SQL Editor: https://console.neon.tech

-- ============================================
-- 1. Property Slugs (for SEO-friendly URLs)
-- ============================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Generate slugs for existing properties
UPDATE properties 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- ============================================
-- 2. Booking Extras Table
-- ============================================
CREATE TABLE IF NOT EXISTS booking_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_extras_booking ON booking_extras(booking_id);

-- ============================================
-- 3. Booking Inquiries Table (for inquiry form)
-- ============================================
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
    status VARCHAR(50) DEFAULT 'pending',  -- pending, confirmed, declined
    notes TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property ON booking_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON booking_inquiries(status);

-- ============================================
-- 4. API Keys Table (for webhook authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '["read"]',
    description TEXT,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- 5. Update Bookings table for direct booking
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
-- source can be: 'manual', 'direct', 'airbnb', 'booking.com', etc.

-- ============================================
-- Done! You can now use:
-- - /book - Browse all properties
-- - /book/[property] - View rooms
-- - /book/[property]/[room] - Room details
-- - /book/confirmation/[id] - Booking receipt
-- - /book/history - Guest booking history
-- ============================================
