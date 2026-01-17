-- Migration: Add refund tracking to bookings table
-- Run this on your Neon/PostgreSQL database

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Add index for refund queries
CREATE INDEX IF NOT EXISTS idx_bookings_refunds ON bookings(refund_amount) WHERE refund_amount > 0;
