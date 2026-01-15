-- Add calendar_connections table for iCal sync
CREATE TABLE IF NOT EXISTS calendar_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,  -- 'airbnb', 'vrbo', 'booking_com', 'other'
    ical_url TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sync_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'syncing', 'success', 'error'
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_connections_property ON calendar_connections(property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active ON calendar_connections(is_active);

-- Add external_id to bookings for tracking imported bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_external_id ON bookings(external_id);

COMMENT ON TABLE calendar_connections IS 'iCal calendar sync connections for importing bookings from external platforms';
COMMENT ON COLUMN bookings.external_id IS 'External booking ID from iCal feed for deduplication';
