-- YieldVibe $200 Premium - Complete Database Schema Enhancement
-- Run this AFTER schema.sql and schema-premium.sql

-- ============================================
-- PHASE 1: Multi-Property Management
-- ============================================

-- Users table (property owners/managers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('owner', 'manager', 'viewer')) DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Property Groups (for organizing multiple properties)
CREATE TABLE IF NOT EXISTS property_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enhanced Properties table (add user ownership & grouping)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES property_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS property_type TEXT CHECK (property_type IN ('hotel', 'apartment', 'house', 'condo', 'villa', 'other')) DEFAULT 'apartment',
ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_guests INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS amenities TEXT[],
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- PHASE 2: Pricing Rules Engine
-- ============================================

-- Pricing Rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT CHECK (rule_type IN (
    'last_minute', 'length_of_stay', 'weekend', 'seasonal', 
    'gap_night', 'orphan_day', 'event_based', 'custom'
  )) NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL, -- e.g., {"days_before_checkin": 7, "discount_percent": 15}
  action JSONB NOT NULL, -- e.g., {"type": "discount", "value": 15, "unit": "percent"}
  date_from DATE,
  date_to DATE,
  days_of_week INT[], -- 0=Sunday, 6=Saturday
  min_nights INT,
  max_nights INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Price History (track all price changes)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  change_reason TEXT NOT NULL,
  rule_id UUID REFERENCES pricing_rules(id) ON DELETE SET NULL,
  changed_by TEXT, -- 'system', 'ai', 'user', 'rule:{rule_name}'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rule Templates (pre-built rule suggestions)
CREATE TABLE IF NOT EXISTS rule_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('beginner', 'advanced', 'expert')) DEFAULT 'beginner',
  rule_type TEXT NOT NULL,
  default_conditions JSONB NOT NULL,
  default_action JSONB NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- PHASE 3: Calendar & Channel Integration
-- ============================================

-- Calendar Connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  channel TEXT CHECK (channel IN ('airbnb', 'vrbo', 'booking_com', 'expedia', 'custom')) NOT NULL,
  ical_url TEXT NOT NULL,
  import_enabled BOOLEAN DEFAULT true,
  export_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT CHECK (sync_status IN ('success', 'error', 'pending', 'never')) DEFAULT 'never',
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Imported Reservations (from external calendars)
CREATE TABLE IF NOT EXISTS imported_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT, -- Reservation ID from external platform
  guest_name TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'blocked', 'tentative')) DEFAULT 'confirmed',
  notes TEXT,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sync Logs (track calendar sync history)
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT CHECK (sync_type IN ('import', 'export')) NOT NULL,
  status TEXT CHECK (status IN ('success', 'error', 'partial')) NOT NULL,
  reservations_added INT DEFAULT 0,
  reservations_updated INT DEFAULT 0,
  reservations_deleted INT DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- PHASE 4: Onboarding & User Experience
-- ============================================

-- Onboarding Progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  step TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  data JSONB, -- Store step-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT CHECK (theme IN ('dark', 'light', 'auto')) DEFAULT 'dark',
  currency TEXT DEFAULT 'USD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT CHECK (time_format IN ('12h', '24h')) DEFAULT '12h',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  tutorial_completed BOOLEAN DEFAULT false,
  default_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  dashboard_layout JSONB, -- Store custom dashboard widget layout
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('booking', 'price_change', 'sync_error', 'insight', 'system')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- PHASE 5: Reporting & Analytics
-- ============================================

-- Expenses (for profit tracking)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN (
    'cleaning', 'maintenance', 'utilities', 'supplies', 
    'commission', 'insurance', 'taxes', 'other'
  )) NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Saved Reports
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('revenue', 'occupancy', 'profit_loss', 'performance', 'custom')) NOT NULL,
  filters JSONB, -- e.g., {"date_from": "2024-01-01", "properties": ["id1", "id2"]}
  schedule TEXT CHECK (schedule IN ('none', 'daily', 'weekly', 'monthly')),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- PHASE 6: Market Intelligence
-- ============================================

-- Events (local events affecting demand)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT,
  event_type TEXT CHECK (event_type IN ('concert', 'conference', 'sports', 'festival', 'holiday', 'other')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  estimated_impact TEXT CHECK (estimated_impact IN ('low', 'medium', 'high')) DEFAULT 'medium',
  source TEXT, -- 'user', 'api', 'ai'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Market Benchmarks (for comparison reporting)
CREATE TABLE IF NOT EXISTS market_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  property_type TEXT,
  date DATE NOT NULL,
  avg_occupancy_rate NUMERIC,
  avg_daily_rate NUMERIC,
  revenue_per_available_room NUMERIC, -- RevPAR
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(city, country, property_type, date)
);

-- ============================================
-- PHASE 7: Guest & Booking Management
-- ============================================

-- Guests
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  notes TEXT,
  tags TEXT[], -- e.g., ['vip', 'repeat', 'problematic']
  total_bookings INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  last_stay_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Link guests to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS guest_notes TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS guest_count INT DEFAULT 1;

-- Tasks (cleaning, maintenance, etc.)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  task_type TEXT CHECK (task_type IN ('cleaning', 'maintenance', 'inspection', 'checkout', 'checkin', 'other')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Message Templates (for future automation)
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger TEXT CHECK (trigger IN ('booking_confirmed', 'pre_checkin', 'post_checkout', 'custom')) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[], -- e.g., ['guest_name', 'check_in_date', 'property_address']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_group_id ON properties(group_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_property_id ON pricing_rules(property_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_room_id ON price_history(room_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_property_id ON calendar_connections(property_id);
CREATE INDEX IF NOT EXISTS idx_imported_reservations_property_id ON imported_reservations(property_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON expenses(property_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_location_date ON events(city, country, start_date);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_tasks_property_id ON tasks(property_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Public read policies (adjust based on your auth strategy)
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read property_groups" ON property_groups FOR SELECT USING (true);
CREATE POLICY "Public read pricing_rules" ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "Public read price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Public read rule_templates" ON rule_templates FOR SELECT USING (true);
CREATE POLICY "Public read calendar_connections" ON calendar_connections FOR SELECT USING (true);
CREATE POLICY "Public read imported_reservations" ON imported_reservations FOR SELECT USING (true);
CREATE POLICY "Public read sync_logs" ON sync_logs FOR SELECT USING (true);
CREATE POLICY "Public read onboarding_progress" ON onboarding_progress FOR SELECT USING (true);
CREATE POLICY "Public read user_preferences" ON user_preferences FOR SELECT USING (true);
CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Public read saved_reports" ON saved_reports FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read market_benchmarks" ON market_benchmarks FOR SELECT USING (true);
CREATE POLICY "Public read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public read message_templates" ON message_templates FOR SELECT USING (true);

-- ============================================
-- SEED DATA: Rule Templates
-- ============================================

INSERT INTO rule_templates (name, description, category, rule_type, default_conditions, default_action, is_popular) VALUES
('Last-Minute Boost (7 Days)', 'Automatically discount rooms 7 days before check-in to fill vacancies', 'beginner', 'last_minute', 
  '{"days_before_checkin": 7, "discount_percent": 15}'::jsonb, 
  '{"type": "discount", "value": 15, "unit": "percent"}'::jsonb, true),
  
('Last-Minute Aggressive (3 Days)', 'Deeper discount 3 days out for last-minute bookings', 'beginner', 'last_minute', 
  '{"days_before_checkin": 3, "discount_percent": 25}'::jsonb, 
  '{"type": "discount", "value": 25, "unit": "percent"}'::jsonb, true),
  
('Weekly Stay Discount', 'Offer 10% off for stays of 7+ nights', 'beginner', 'length_of_stay', 
  '{"min_length": 7, "discount_percent": 10}'::jsonb, 
  '{"type": "discount", "value": 10, "unit": "percent"}'::jsonb, true),
  
('Monthly Stay Discount', 'Offer 20% off for stays of 30+ nights', 'advanced', 'length_of_stay', 
  '{"min_length": 30, "discount_percent": 20}'::jsonb, 
  '{"type": "discount", "value": 20, "unit": "percent"}'::jsonb, false),
  
('Weekend Premium (Fri-Sat)', 'Charge 20% more on Friday and Saturday nights', 'beginner', 'weekend', 
  '{"days_of_week": [5, 6], "surge_percent": 20}'::jsonb, 
  '{"type": "surge", "value": 20, "unit": "percent"}'::jsonb, true),
  
('Gap Night Auto-Fill', 'Discount 1-night gaps between bookings to fill calendar', 'advanced', 'gap_night', 
  '{"max_gap_nights": 1, "discount_percent": 30}'::jsonb, 
  '{"type": "discount", "value": 30, "unit": "percent"}'::jsonb, false),
  
('High Season Premium', 'Increase prices during peak season', 'beginner', 'seasonal', 
  '{"season": "high", "surge_percent": 30}'::jsonb, 
  '{"type": "surge", "value": 30, "unit": "percent"}'::jsonb, true),
  
('Low Season Discount', 'Reduce prices during slow season to maintain occupancy', 'beginner', 'seasonal', 
  '{"season": "low", "discount_percent": 15}'::jsonb, 
  '{"type": "discount", "value": 15, "unit": "percent"}'::jsonb, false),
  
('Event Surge Pricing', 'Automatically increase prices during local events', 'advanced', 'event_based', 
  '{"event_type": ["concert", "conference", "sports"], "surge_percent": 40}'::jsonb, 
  '{"type": "surge", "value": 40, "unit": "percent"}'::jsonb, false),
  
('Orphan Day Protection', 'Prevent creating 1-day gaps in the calendar', 'expert', 'orphan_day', 
  '{"min_stay_if_orphan": 2, "discount_for_fill": 20}'::jsonb, 
  '{"type": "min_nights", "value": 2}'::jsonb, false);

-- ============================================
-- SEED DATA: Demo User & Property
-- ============================================

-- Insert demo user
INSERT INTO users (id, email, full_name, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@yieldvibe.com', 'Demo Owner', 'owner')
ON CONFLICT (email) DO NOTHING;

-- Insert demo property group
INSERT INTO property_groups (id, user_id, name, description, color) 
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Downtown Properties', 'City center locations', '#6366f1')
ON CONFLICT DO NOTHING;

-- Update existing properties to have user ownership
UPDATE properties 
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id IS NULL;

-- Insert demo user preferences
INSERT INTO user_preferences (user_id, theme, currency, tutorial_completed) 
VALUES ('00000000-0000-0000-0000-000000000001', 'dark', 'USD', false)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON pricing_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
