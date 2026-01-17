ALTER TABLE rooms ADD COLUMN IF NOT EXISTS name TEXT;

-- Populate existing null names with a default "Room X" format using part of UUID
UPDATE rooms 
SET name = 'Room-' || substring(id::text, 1, 4) 
WHERE name IS NULL;
