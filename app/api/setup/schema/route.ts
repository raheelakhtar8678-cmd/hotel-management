
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const SCHEMA_SQL = `
-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Properties Table
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  base_price numeric not null,
  min_price numeric not null,
  max_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid, -- Added for multi-user support potentially
  is_active boolean default true,
  property_type text,
  city text,
  country text,
  address text,
  bedrooms integer,
  bathrooms integer,
  max_guests integer,
  timezone text
);

-- Rooms Table
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade not null,
  status text check (status in ('available', 'maintenance', 'occupied')) default 'available',
  type text not null,
  current_price numeric,
  last_logic_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  check_in date not null,
  check_out date not null,
  total_paid numeric not null,
  status text check (status in ('confirmed', 'cancelled')) default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  channel text CHECK (channel IN ('booking_com', 'expedia', 'airbnb', 'direct', 'other')) DEFAULT 'direct'
);

-- Price History Table
create table if not exists price_history (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  old_price numeric,
  new_price numeric not null,
  reason text,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- System Settings
create table if not exists system_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('event_alert', 'demand_surge', 'competitor_update')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  suggested_price_change NUMERIC,
  estimated_revenue_impact NUMERIC,
  target_room_ids UUID[],
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT
);

-- Competitors Table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  address TEXT,
  selector_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Competitor Logs Table
CREATE TABLE IF NOT EXISTS competitor_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC NOT NULL,
  room_type TEXT,
  date_checked DATE NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Calendar Connections Table (Checking if exists first to avoid errors)
CREATE TABLE IF NOT EXISTS calendar_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('airbnb', 'vrbo', 'booking_com', 'other')) NOT NULL,
    ical_url TEXT NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT CHECK (sync_status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add external_id to bookings if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='external_id') THEN 
        ALTER TABLE bookings ADD COLUMN external_id TEXT; 
    END IF; 
END $$;

-- Update system_settings defaults
INSERT INTO system_settings (key, value, description) 
VALUES 
  ('gemini_api_key', '', 'User-provided Gemini API key for AI insights'),
  ('floor_price', '99', 'Minimum room price - never go below this'),
  ('ceiling_price', '400', 'Maximum room price - never go above this'),
  ('ai_insights_enabled', 'true', 'Enable AI-powered revenue insights'),
  ('competitor_tracking_enabled', 'true', 'Enable competitor price tracking')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies (Idempotent checks)
DO $$ 
BEGIN
    -- Enable RLS
    ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
    ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
    ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE competitor_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL; -- Ignore if already enabled
END $$;

-- Create policies (Dropping first to avoid conflict)
DROP POLICY IF EXISTS "Public read properties" ON properties;
CREATE POLICY "Public read properties" ON properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read rooms" ON rooms;
CREATE POLICY "Public read rooms" ON rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read bookings" ON bookings;
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read price_history" ON price_history;
CREATE POLICY "Public read price_history" ON price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read system_settings" ON system_settings;
CREATE POLICY "Public read system_settings" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ai_insights" ON ai_insights;
CREATE POLICY "Public read ai_insights" ON ai_insights FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read competitors" ON competitors;
CREATE POLICY "Public read competitors" ON competitors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read competitor_logs" ON competitor_logs;
CREATE POLICY "Public read competitor_logs" ON competitor_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read calendar_connections" ON calendar_connections;
CREATE POLICY "Public read calendar_connections" ON calendar_connections FOR SELECT USING (true);
`;

export async function POST(request: Request) {
  let client;
  try {
    const { connectionString } = await request.json();

    // Use provided string or env var
    const dbUrl = connectionString || process.env.DATABASE_URL;

    if (!dbUrl) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL is missing. Please set it in Settings.' },
        { status: 400 }
      );
    }

    // Connect to Postgres
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false } // Required for Supabase transaction pooler
    });

    client = await pool.connect();

    // Run Schema
    await client.query(SCHEMA_SQL);

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully! All tables created.'
    });

  } catch (error: any) {
    console.error('Schema setup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize database' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    sql: SCHEMA_SQL
  });
}
