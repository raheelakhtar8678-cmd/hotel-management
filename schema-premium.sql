-- YieldVibe Premium - Additional Schema for Advanced Features

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

-- Add channel column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS channel TEXT 
CHECK (channel IN ('booking_com', 'expedia', 'airbnb', 'direct', 'other')) 
DEFAULT 'direct';

-- Update system_settings for new features
INSERT INTO system_settings (key, value, description) 
VALUES 
  ('gemini_api_key', '', 'User-provided Gemini API key for AI insights'),
  ('floor_price', '99', 'Minimum room price - never go below this'),
  ('ceiling_price', '400', 'Maximum room price - never go above this'),
  ('ai_insights_enabled', 'true', 'Enable AI-powered revenue insights'),
  ('competitor_tracking_enabled', 'true', 'Enable competitor price tracking')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies for new tables
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ai_insights" ON ai_insights FOR SELECT USING (true);
CREATE POLICY "Public read competitors" ON competitors FOR SELECT USING (true);
CREATE POLICY "Public read competitor_logs" ON competitor_logs FOR SELECT USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_logs_date ON competitor_logs(competitor_id, date_checked DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_channel ON bookings(channel);
