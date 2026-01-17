CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  
  property_id UUID REFERENCES properties(id),
  assigned_room_id UUID REFERENCES rooms(id),
  
  work_start_time TEXT,
  work_end_time TEXT,
  
  contact_phone TEXT,
  contact_email TEXT,
  
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Index for faster filtering by property
CREATE INDEX IF NOT EXISTS idx_staff_property_id ON staff(property_id);
