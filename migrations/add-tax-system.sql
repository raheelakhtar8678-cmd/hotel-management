-- Migration: Add Tax System
-- Run this SQL in your Neon/Vercel Postgres database

-- Create taxes table for custom tax rules
CREATE TABLE IF NOT EXISTS taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL CHECK (value >= 0),
    applies_to TEXT NOT NULL CHECK (applies_to IN ('room', 'extras', 'total')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add tax fields to bookings to store tax breakdown
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS taxes_applied TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_total NUMERIC DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_taxes_property ON taxes(property_id) WHERE is_active = true;
