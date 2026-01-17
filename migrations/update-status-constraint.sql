-- Migration: Update bookings status check constraint
-- Run this to allow 'refunded' status in the database

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'refunded'));
