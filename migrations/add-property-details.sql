-- Migration: Add Caretaker Info and Structure Details to Properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS caretaker_name TEXT,
ADD COLUMN IF NOT EXISTS caretaker_email TEXT,
ADD COLUMN IF NOT EXISTS caretaker_phone TEXT,
ADD COLUMN IF NOT EXISTS structure_details JSONB DEFAULT '{}'::jsonb;
