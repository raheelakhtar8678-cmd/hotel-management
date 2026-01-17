'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Database, RefreshCw, LayoutDashboard, Key, FileCode, Copy } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Quick check API to see if DB is connected
        fetch('/api/setup/check-db').then(res => res.json()).then(data => {
            setIsConnected(data.connected);
        }).catch(() => setIsConnected(false));
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Manage your database and application configuration.</p>
            </div>

            <Card className={isConnected ? "border-emerald-500/50 bg-emerald-500/5" : "border-blue-500/50 bg-blue-500/5"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Connection (Neon Postgres)
                    </CardTitle>
                    <CardDescription>
                        Connect your Neon database via environment variables (POSTGRES_URL).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isConnected ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <Check className="h-5 w-5" />
                                Connected to Database
                            </div>

                            <Button
                                onClick={async () => {
                                    if (!confirm("This will create all necessary tables. Continue?")) return;
                                    setLoading(true);
                                    try {
                                        const res = await fetch('/api/setup/schema', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) {
                                            alert("Database initialized successfully! 🎉\n\nYou can now create properties.");
                                        } else {
                                            alert("Error: " + data.error);
                                        }
                                    } catch (e: any) { alert("Failed to connect: " + e.message); }
                                    setLoading(false);
                                }}
                                disabled={loading}
                            >
                                {loading ? "Initializing..." : "Initialize / Repair Database Tables"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <AlertCircle className="h-5 w-5" />
                                Action Required: Add POSTGRES_URL Environment Variable
                            </div>
                            <p className="text-sm text-foreground/80">
                                Add your Neon pooled connection string as POSTGRES_URL in environment variables.
                            </p>
                            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-sm font-mono border">
                                1. Go to console.neon.tech<br />
                                2. Get your "Pooled connection" string<br />
                                3. Add POSTGRES_URL to Vercel environment variables<br />
                                4. Redeploy your application
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => window.open('https://console.neon.tech', '_blank')}>
                                    Open Neon Console
                                    <LayoutDashboard className="ml-2 h-4 w-4" />
                                </Button>
                                <Button variant="ghost" onClick={() => window.location.reload()}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Check Again
                                </Button>
                            </div>

                            <div className="pt-4 mt-4 border-t">
                                <details className="text-sm">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        Trouble connecting? Enter manual connection string
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                        <p className="text-xs text-muted-foreground">
                                            If the Vercel Integration isn't working, paste the connection string from your Neon database here.
                                            <strong> Use the "Pooled connection" string if available, or the direct one will work too.</strong>
                                        </p>
                                        <input
                                            id="manualString"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                            placeholder="postgresql://..."
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={async () => {
                                                const str = (document.getElementById('manualString') as HTMLInputElement).value;
                                                if (!str) return alert("Please enter a connection string");

                                                setLoading(true);
                                                try {
                                                    const res = await fetch('/api/setup/schema', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ connectionString: str })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert("Success! 🎉\n\nIMPORTANT: Now add this string as 'POSTGRES_URL' in Vercel Settings → Environment Variables so the rest of the app works.");
                                                    } else {
                                                        alert("Error: " + data.error);
                                                    }
                                                } catch (e: any) { alert(e.message); }
                                                setLoading(false);
                                            }}
                                        >
                                            Initialize with Manual String
                                        </Button>
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Price Limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Price Limits</CardTitle>
                    <CardDescription>Set global min/max price constraints for automated pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Minimum Price (Floor)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    defaultValue="99"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-7 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Prices won't go below this amount</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Maximum Price (Ceiling)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    defaultValue="400"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-7 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Prices won't go above this amount</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Environment Variables */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Environment Variables
                    </CardTitle>
                    <CardDescription>Configure API keys and settings via environment variables (not stored in database)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2">Required Variables:</h4>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">POSTGRES_URL</span>
                                <span className="text-xs text-green-600">✓ Required</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-sans">Your Neon pooled connection string</p>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2">Optional - For AI Features:</h4>
                        <div className="space-y-3 text-sm font-mono">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">GEMINI_API_KEY</span>
                                    <span className="text-xs text-orange-600">Optional</span>
                                </div>
                                <p className="text-xs text-muted-foreground font-sans mt-1">
                                    Get from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-primary underline">Google AI Studio</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-900 border rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2">How to Add:</h4>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Go to Vercel Project Settings → Environment Variables</li>
                            <li>Add the variable name and value</li>
                            <li>Select all environments (Production, Preview, Development)</li>
                            <li>Redeploy your application</li>
                        </ol>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => window.open('https://vercel.com/docs/projects/environment-variables', '_blank')}
                        >
                            View Vercel Docs
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {/* Database Setup Scripts - Added for User Convenience */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-5 w-5" />
                        Database Setup Scripts
                    </CardTitle>
                    <CardDescription>
                        Run these SQL commands in your Neon SQL Editor to fix missing tables or columns.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {[
                            {
                                title: "1. Create Missing Tables (Room Extras & Neon Demo)",
                                sql: `CREATE TABLE IF NOT EXISTS room_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_category TEXT CHECK (item_category IN ('food', 'beverage', 'service', 'amenity', 'other')) DEFAULT 'other',
  price NUMERIC NOT NULL,
  quantity INT DEFAULT 1,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE room_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read room_extras" ON room_extras FOR SELECT USING (true);
CREATE TABLE IF NOT EXISTS playing_with_neon(id SERIAL PRIMARY KEY, name TEXT NOT NULL, value REAL);
INSERT INTO playing_with_neon(name, value)
  SELECT LEFT(md5(i::TEXT), 10), random() FROM generate_series(1, 10) s(i);
SELECT * FROM playing_with_neon;`
                            },
                            {
                                title: "2. Create Pricing Rules Table",
                                sql: `CREATE TABLE IF NOT EXISTS pricing_rules (
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
  conditions JSONB NOT NULL,
  action JSONB NOT NULL,
  date_from DATE,
  date_to DATE,
  days_of_week INT[],
  min_nights INT,
  max_nights INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`
                            },
                            {
                                title: "3. Update Bookings (Guest Info)",
                                sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests INT DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('booking_com', 'expedia', 'airbnb', 'direct', 'other')) DEFAULT 'direct';`
                            },
                            {
                                title: "4. Add Refund Support",
                                sql: `ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;`
                            },
                            {
                                title: "5. Fix Status Constraint (Important for Refunds)",
                                sql: `ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'refunded'));`
                            },
                            {
                                title: "6. Add Property Details (Caretaker & Structure)",
                                sql: `ALTER TABLE properties
ADD COLUMN IF NOT EXISTS caretaker_name TEXT,
ADD COLUMN IF NOT EXISTS caretaker_email TEXT,
ADD COLUMN IF NOT EXISTS caretaker_phone TEXT,
ADD COLUMN IF NOT EXISTS structure_details JSONB DEFAULT '{}'::jsonb;`
                            }
                        ].map((item, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                                <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
                                    <span className="font-medium text-sm">{item.title}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.sql);
                                            alert("Copied SQL to clipboard!");
                                        }}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                                <pre className="bg-slate-950 text-slate-50 p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                    {item.sql}
                                </pre>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
