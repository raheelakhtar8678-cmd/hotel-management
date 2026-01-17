CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT CHECK (rule_type IN ('early_bird', 'last_minute', 'long_stay', 'weekend', 'seasonal', 'custom')) NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}'::jsonb,
    action JSONB DEFAULT '{"type":"percentage","value":0}'::jsonb,
    date_from DATE,
    date_to DATE,
    days_of_week TEXT,
    min_nights INTEGER,
    max_nights INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_property ON pricing_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
