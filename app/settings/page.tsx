"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Copy, CheckCircle2, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    const [copied, setCopied] = useState(false);

    const migrationSQL = `-- COMPLETE DATABASE SETUP & MIGRATION
-- Run this entire script in your Neon/Vercel Postgres dashboard to set up everything.

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BASE TABLES (If not already created)

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    base_price DECIMAL(10, 2),
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    images TEXT, -- Stores JSON array of image URLs
    amenities TEXT, -- Stores JSON array of amenities
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    max_guests INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',
    caretaker_name VARCHAR(100),
    caretaker_email VARCHAR(100),
    caretaker_phone VARCHAR(20),
    structure_details JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50),
    description TEXT,
    capacity INTEGER,
    base_price DECIMAL(10, 2),
    current_price DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'available',
    last_cleaned_at TIMESTAMP WITH TIME ZONE,
    amenities TEXT, -- Stores JSON array of amenities
    images TEXT, -- Stores JSON array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_logic_check TIMESTAMP WITH TIME ZONE,
    last_logic_reason TEXT,
    ical_url TEXT
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    user_id UUID,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER,
    total_paid DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'confirmed',
    payment_status VARCHAR(20) DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    external_id VARCHAR(255),
    source VARCHAR(50) DEFAULT 'direct',
    channel VARCHAR(50) DEFAULT 'direct',
    taxes_applied TEXT,
    tax_total DECIMAL(10, 2) DEFAULT 0
);

-- 3. NEW FEATURES (TAILED UPDATES)

-- Pricing Rules Table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('seasonal', 'occupancy', 'last_minute', 'weekend', 'custom')),
    amount DECIMAL(10, 2) NOT NULL,
    is_percentage BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
    min_occupancy INTEGER,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Taxes Table (New Tax System)
CREATE TABLE IF NOT EXISTS taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL CHECK (value >= 0),
    applies_to TEXT NOT NULL CHECK (applies_to IN ('room', 'extras', 'total')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Room Extras Table
CREATE TABLE IF NOT EXISTS room_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    charge_type VARCHAR(20) DEFAULT 'one-time', -- 'one-time' or 'per-night'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_taxes_property ON taxes(property_id) WHERE is_active = true;
`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(migrationSQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                    Settings
                </h2>
                <p className="text-muted-foreground">
                    Configure your hotel management system
                </p>
            </div>

            <div className="max-w-4xl space-y-6">
                {/* Database Migration */}
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            <CardTitle>Database Migration</CardTitle>
                        </div>
                        <CardDescription>
                            Run this SQL to enable room amenities and image galleries
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium">SQL Migration Script</p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy SQL
                                        </>
                                    )}
                                </Button>
                            </div>
                            <pre className="text-xs bg-black/40 p-4 rounded overflow-x-auto">
                                <code>{migrationSQL}</code>
                            </pre>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold">How to Run:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Click "Copy SQL" above</li>
                                <li>Open your <a href="https://vercel.com/dashboard" target="_blank" className="text-primary hover:underline">Vercel Dashboard</a></li>
                                <li>Navigate to Storage → Postgres → Your Database</li>
                                <li>Click "Query" tab</li>
                                <li>Paste the SQL and click "Run"</li>
                                <li>Refresh this page to start using the new features!</li>
                            </ol>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                            <p className="text-sm">
                                ⚠️ <span className="font-semibold">Important:</span> Run this migration once to enable:
                            </p>
                            <ul className="text-sm mt-2 space-y-1 ml-4">
                                <li>• Room amenities (TV, WiFi, AC, etc.)</li>
                                <li>• 5-image galleries for rooms</li>
                                <li>• 5-image galleries for properties</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Image Upload Info */}
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Image Upload Options</CardTitle>
                        </div>
                        <CardDescription>
                            Understanding URL-based vs file upload
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Current: URL-based */}
                            <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
                                <h4 className="font-semibold mb-2 text-emerald-500">✅ Current System (URL-based)</h4>
                                <ul className="text-sm space-y-2">
                                    <li>✓ <span className="font-medium">Zero storage cost</span></li>
                                    <li>✓ Images hosted externally (Unsplash, Google Images)</li>
                                    <li>✓ Unlimited images (no space limits)</li>
                                    <li>✓ Fast performance</li>
                                    <li>⚠️ Requires valid image URLs</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-3">
                                    <span className="font-semibold">Free forever</span> - No storage costs!
                                </p>
                            </div>

                            {/* File Upload Option */}
                            <div className="border border-muted rounded-lg p-4 bg-secondary/10">
                                <h4 className="font-semibold mb-2">📤 File Upload (Optional Upgrade)</h4>
                                <ul className="text-sm space-y-2">
                                    <li>✓ Upload from computer</li>
                                    <li>✓ Full control over images</li>
                                    <li>⚠️ <span className="font-medium">Requires Vercel Blob Storage ($$$)</span></li>
                                    <li>⚠️ Storage limits apply (costs increase with usage)</li>
                                    <li>⚠️ Additional API integration needed</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-3">
                                    <span className="font-semibold">Paid feature</span> - Vercel Blob pricing applies
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-sm">
                                💡 <span className="font-semibold">Recommendation:</span> Use free image hosting services like:
                            </p>
                            <ul className="text-sm mt-2 space-y-1 ml-4">
                                <li>• <a href="https://unsplash.com" target="_blank" className="text-primary hover:underline">Unsplash</a> (free high-quality photos)</li>
                                <li>• <a href="https://imgbb.com" target="_blank" className="text-primary hover:underline">ImgBB</a> (free image hosting)</li>
                                <li>• <a href="https://imgur.com" target="_blank" className="text-primary hover:underline">Imgur</a> (free image hosting)</li>
                                <li>• Google Drive (make image link public)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
