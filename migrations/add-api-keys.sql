-- API Keys table for webhook authentication
-- Run this migration to enable the Webhook API feature

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '["read"]',
    description TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Comment for documentation
COMMENT ON TABLE api_keys IS 'API keys for external integrations (n8n, Zapier, Make.com, etc.)';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key (key itself is never stored)';
COMMENT ON COLUMN api_keys.permissions IS 'Array of permissions: read, write, admin';
