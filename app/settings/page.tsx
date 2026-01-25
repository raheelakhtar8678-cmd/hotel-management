"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Copy, CheckCircle2, Settings as SettingsIcon, Percent, Trash2, Plus, Key, Eye, EyeOff, AlertTriangle, Lock, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("migration");
    const [copied, setCopied] = useState(false);

    // Tax Management State
    const [properties, setProperties] = useState<any[]>([]);
    const [taxes, setTaxes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<string>("");
    const [newTax, setNewTax] = useState({
        name: "",
        type: "percentage",
        value: "",
        applies_to: "total"
    });

    // API Keys State
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);
    const [migrationSql, setMigrationSql] = useState("");

    useEffect(() => {
        fetchProperties();
        fetchApiKeys();
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            fetchTaxes(selectedProperty);
        }
    }, [selectedProperty]);

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties?fields=light");
            const data = await res.json();
            if (data.properties) {
                setProperties(data.properties);
                if (data.properties.length > 0) {
                    setSelectedProperty(data.properties[0].id);
                }
            }
        } catch (e) {
            console.error("Error fetching properties", e);
        }
    };

    const fetchTaxes = async (propertyId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/taxes?property_id=${propertyId}`);
            const data = await res.json();
            if (data.taxes) setTaxes(data.taxes);
        } catch (e) {
            console.error("Error fetching taxes", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTax = async () => {
        if (!selectedProperty || !newTax.name || !newTax.value) return;
        try {
            const res = await fetch("/api/taxes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    property_id: selectedProperty,
                    ...newTax,
                    value: Number(newTax.value)
                })
            });
            if (res.ok) {
                fetchTaxes(selectedProperty);
                setNewTax({ name: "", type: "percentage", value: "", applies_to: "total" });
            }
        } catch (e) {
            console.error("Error creating tax", e);
        }
    };

    const handleDeleteTax = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tax?")) return;
        try {
            await fetch(`/api/taxes?id=${id}`, { method: "DELETE" });
            fetchTaxes(selectedProperty);
        } catch (e) {
            console.error("Error deleting tax", e);
        }
    };

    // API Key Functions
    const fetchApiKeys = async () => {
        try {
            const res = await fetch("/api/api-keys");
            const data = await res.json();
            if (data.keys) setApiKeys(data.keys);
            if (data.needsMigration) {
                setNeedsMigration(true);
                setMigrationSql(data.migrationSql || "");
            }
        } catch (e) {
            console.error("Error fetching API keys", e);
        }
    };

    const handleCreateApiKey = async () => {
        if (!newKeyName.trim()) {
            alert("Please enter a name for the API key");
            return;
        }
        try {
            const res = await fetch("/api/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newKeyName,
                    permissions: newKeyPermissions
                })
            });
            const data = await res.json();
            if (data.success && data.key) {
                setGeneratedKey(data.key.apiKey);
                setShowKey(true);
                setNewKeyName("");
                fetchApiKeys();
            } else {
                alert(data.error || "Failed to create API key");
            }
        } catch (e) {
            console.error("Error creating API key", e);
        }
    };

    const handleDeleteApiKey = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
        try {
            await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
            fetchApiKeys();
        } catch (e) {
            console.error("Error deleting API key", e);
        }
    };

    // SQL Snippets
    const sqlBase = `-- 1. ENABLE EXTENSIONS & BASE TABLES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    images TEXT, -- JSON array of image URLs
    amenities TEXT, -- JSON array of amenities
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
    amenities TEXT, -- JSON array of amenities
    images TEXT, -- JSON array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_logic_check TIMESTAMP WITH TIME ZONE,
    last_logic_reason TEXT,
    ical_url TEXT
);
-- Ensure room names exist
UPDATE rooms SET name = 'Room-' || substring(id::text, 1, 4) WHERE name IS NULL;
`;

    const sqlBookings = `-- 2. BOOKINGS & STAFF
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
    tax_total DECIMAL(10, 2) DEFAULT 0,
    refund_amount NUMERIC DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'refunded'));

-- Staff Table
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
`;

    const sqlTaxes = `-- 3. TAX SYSTEM
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

-- Add tax fields to bookings if missing
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS taxes_applied TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_total NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_taxes_property ON taxes(property_id) WHERE is_active = true;
`;

    const sqlExtras = `-- 4. EXTRAS & PRICE RULES
-- Room Extras
CREATE TABLE IF NOT EXISTS room_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
    item_name TEXT NOT NULL,
    item_category TEXT CHECK (item_category IN ('food', 'beverage', 'service', 'amenity', 'other')) DEFAULT 'other',
    price NUMERIC NOT NULL,
    quantity INTEGER DEFAULT 1,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    charge_type VARCHAR(20) DEFAULT 'one-time',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing Rules
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT CHECK (rule_type IN ('last_minute', 'length_of_stay', 'weekend', 'seasonal', 'gap_night', 'orphan_day', 'event_based', 'custom')) NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}'::jsonb,
    action JSONB DEFAULT '{"type":"percentage","value":0}'::jsonb,
    date_from DATE,
    date_to DATE,
    days_of_week INTEGER[],
    min_nights INTEGER,
    max_nights INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);
`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                        Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure database, taxes, and system preferences
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-primary/20 pb-1">
                <button
                    onClick={() => setActiveTab("migration")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "migration" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" /> SQL Guide
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("taxes")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "taxes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" /> Manage Taxes
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("images")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "images" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4" /> Images
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("apikeys")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "apikeys" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" /> API Keys
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("auth")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "auth" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Admin Auth
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("booking")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "booking" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Direct Booking
                    </div>
                </button>
            </div>


            <div className="max-w-4xl space-y-6">

                {/* SQL Guide Tab */}
                {activeTab === "migration" && (
                    <div className="space-y-6">
                        <div className="grid gap-6">
                            {[
                                { title: "1. Extensions & Base Tables", sql: sqlBase, desc: "Properties and Rooms setup" },
                                { title: "2. Bookings & Staff", sql: sqlBookings, desc: "Bookings logic and staff management" },
                                { title: "3. Tax System", sql: sqlTaxes, desc: "Tax tables and booking columns" },
                                { title: "4. Extras & Pricing", sql: sqlExtras, desc: "Room extras and dynamic pricing rules" }
                            ].map((section, idx) => (
                                <Card key={idx} className="glass-card">
                                    <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base">{section.title}</CardTitle>
                                                <CardDescription className="text-xs">{section.desc}</CardDescription>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(section.sql)}>
                                                <Copy className="h-3 w-3 mr-1" /> Copy
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="py-3 bg-secondary/10">
                                        <pre className="text-[10px] bg-black/40 p-3 rounded overflow-x-auto h-32 text-muted-foreground">
                                            <code>{section.sql}</code>
                                        </pre>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manage Taxes Tab */}
                {activeTab === "taxes" && (
                    <div className="space-y-6">
                        {/* Select Property */}
                        <div className="flex items-center gap-3 bg-secondary/20 p-4 rounded-lg">
                            <Label>Select Property:</Label>
                            <select
                                className="bg-background border rounded px-3 py-1"
                                value={selectedProperty}
                                onChange={(e) => setSelectedProperty(e.target.value)}
                            >
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Existing Taxes */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {taxes.map(tax => (
                                <Card key={tax.id} className="glass-card border-l-4 border-l-primary">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold">{tax.name}</h4>
                                            <div className="text-sm text-muted-foreground flex gap-2">
                                                <span className="bg-secondary/30 px-2 py-0.5 rounded text-xs capitalize">
                                                    {tax.type}: {tax.value}{tax.type === 'percentage' ? '%' : ''}
                                                </span>
                                                <span className="bg-secondary/30 px-2 py-0.5 rounded text-xs capitalize">
                                                    Applied to: {tax.applies_to}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                            onClick={() => handleDeleteTax(tax.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {taxes.length === 0 && (
                                <div className="col-span-2 text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No taxes configured for this property.
                                </div>
                            )}
                        </div>

                        {/* Add New Tax Form */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Add New Tax</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Tax Name</Label>
                                        <Input
                                            placeholder="e.g. VAT, GST"
                                            value={newTax.name}
                                            onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newTax.type}
                                            onChange={(e) => setNewTax({ ...newTax, type: e.target.value })}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount ($)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Value</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={newTax.value}
                                            onChange={(e) => setNewTax({ ...newTax, value: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Applies To</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newTax.applies_to}
                                            onChange={(e) => setNewTax({ ...newTax, applies_to: e.target.value })}
                                        >
                                            <option value="room">Room Rate Only</option>
                                            <option value="extras">Extras Only</option>
                                            <option value="total">Subtotal (Room + Extras)</option>
                                        </select>
                                    </div>
                                </div>
                                <Button className="w-full mt-4 bg-gradient-primary" onClick={handleCreateTax}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Tax Rule
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "images" && (
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
                                </div>

                                {/* File Upload Option */}
                                <div className="border border-muted rounded-lg p-4 bg-secondary/10">
                                    <h4 className="font-semibold mb-2">📤 File Upload (Optional Upgrade)</h4>
                                    <ul className="text-sm space-y-2">
                                        <li>✓ Upload from computer</li>
                                        <li>✓ Full control over images</li>
                                        <li>⚠️ <span className="font-medium">Requires Vercel Blob Storage ($$$)</span></li>
                                        <li>⚠️ Storage limits apply</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* API Keys Tab */}
                {activeTab === "apikeys" && (
                    <div className="space-y-6">
                        {/* Info Banner */}
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Key className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-primary">Webhook API Keys</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Generate API keys to allow external tools (n8n, Zapier, Make.com) to interact with your property management system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Migration Warning */}
                        {needsMigration && (
                            <Card className="border-yellow-500/50 bg-yellow-500/10">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        <CardTitle className="text-yellow-600">Database Migration Required</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm mb-4">Run this SQL in your Neon database to enable API keys:</p>
                                    <div className="relative">
                                        <pre className="text-xs bg-black/40 p-3 rounded overflow-x-auto text-muted-foreground">
                                            <code>{migrationSql}</code>
                                        </pre>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="absolute top-2 right-2"
                                            onClick={() => copyToClipboard(migrationSql)}
                                        >
                                            <Copy className="h-3 w-3 mr-1" /> Copy
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Generated Key Display */}
                        {generatedKey && (
                            <Card className="border-emerald-500/50 bg-emerald-500/10">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <CardTitle className="text-emerald-600">API Key Generated!</CardTitle>
                                    </div>
                                    <CardDescription>Save this key now - it won't be shown again!</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 bg-black/20 p-3 rounded font-mono text-sm">
                                        <code className="flex-1 break-all">
                                            {showKey ? generatedKey : generatedKey.replace(/./g, '•')}
                                        </code>
                                        <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
                                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedKey)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setGeneratedKey(null)}
                                    >
                                        I've saved my key
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Create New Key */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Create New API Key</CardTitle>
                                <CardDescription>Generate a key for external integrations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Key Name</Label>
                                        <Input
                                            placeholder="e.g. n8n Integration"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Permissions</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newKeyPermissions.includes("write") ? "readwrite" : "read"}
                                            onChange={(e) => setNewKeyPermissions(
                                                e.target.value === "readwrite"
                                                    ? ["read", "write"]
                                                    : ["read"]
                                            )}
                                        >
                                            <option value="read">Read Only</option>
                                            <option value="readwrite">Read & Write</option>
                                        </select>
                                    </div>
                                    <Button
                                        className="bg-gradient-primary"
                                        onClick={handleCreateApiKey}
                                        disabled={needsMigration}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Generate Key
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing Keys */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Active API Keys</CardTitle>
                                <CardDescription>Manage your existing integration keys</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {apiKeys.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        No API keys created yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {apiKeys.map(key => (
                                            <div
                                                key={key.id}
                                                className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border"
                                            >
                                                <div>
                                                    <div className="font-semibold flex items-center gap-2">
                                                        {key.name}
                                                        <Badge variant="outline" className="text-xs">
                                                            {key.permissions?.includes("write") ? "Read/Write" : "Read Only"}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Created: {new Date(key.created_at).toLocaleDateString()}
                                                        {key.last_used_at && (
                                                            <span className="ml-3">
                                                                Last used: {new Date(key.last_used_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteApiKey(key.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Webhook Endpoints Reference */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Your Webhook URLs</CardTitle>
                                <CardDescription>
                                    Copy these full URLs to use in n8n, Zapier, or Make.com
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-3 p-2 bg-primary/10 rounded text-sm">
                                    <strong>Base URL:</strong>{" "}
                                    <code className="bg-black/10 px-1 rounded">
                                        {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}
                                    </code>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {[
                                        { method: "GET", path: "/api/webhooks/booking", desc: "List recent bookings" },
                                        { method: "POST", path: "/api/webhooks/booking", desc: "Create new booking" },
                                        { method: "GET", path: "/api/webhooks/availability", desc: "Check room availability" },
                                        { method: "GET", path: "/api/webhooks/rooms", desc: "List rooms with status" },
                                        { method: "GET", path: "/api/webhooks/revenue", desc: "Revenue summary" },
                                    ].map((endpoint, i) => {
                                        const fullUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app') + endpoint.path;
                                        return (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-secondary/10 rounded group">
                                                <Badge className={endpoint.method === "GET" ? "bg-emerald-500" : "bg-blue-500"}>
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="font-mono text-xs flex-1 truncate" title={fullUrl}>
                                                    {fullUrl}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-50 group-hover:opacity-100"
                                                    onClick={() => copyToClipboard(fullUrl)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 p-3 bg-secondary/20 rounded text-xs text-muted-foreground">
                                    <strong>Authentication:</strong> Add header <code className="bg-black/20 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Admin Auth Tab */}
                {activeTab === "auth" && (
                    <div className="space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" />
                                    Admin Password Protection
                                </CardTitle>
                                <CardDescription>
                                    Protect your admin dashboard with a password
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                    <h4 className="font-medium text-amber-600 flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Setup Required
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Set the <code className="bg-secondary px-1 rounded">ADMIN_PASSWORD</code> environment variable in Vercel to enable authentication.
                                    </p>
                                    <div className="bg-secondary/50 rounded p-3 font-mono text-sm">
                                        ADMIN_PASSWORD=your-secret-password
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">How It Works</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            Admin pages (dashboard, bookings, settings) redirect to <code className="bg-secondary px-1 rounded">/login</code>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            Session persists for 7 days in a secure HTTP-only cookie
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            Logout button in the navigation header
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Protected Routes</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-secondary/50 rounded p-2">🔒 / (Dashboard)</div>
                                        <div className="bg-secondary/50 rounded p-2">🔒 /bookings</div>
                                        <div className="bg-secondary/50 rounded p-2">🔒 /properties</div>
                                        <div className="bg-secondary/50 rounded p-2">🔒 /settings</div>
                                        <div className="bg-secondary/50 rounded p-2">🔒 /inventory</div>
                                        <div className="bg-secondary/50 rounded p-2">🔒 /reports</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Public Routes (No Login)</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-emerald-500/10 rounded p-2">🌍 /login</div>
                                        <div className="bg-emerald-500/10 rounded p-2">🌍 /book/*</div>
                                        <div className="bg-emerald-500/10 rounded p-2">🌍 /api/webhooks/*</div>
                                        <div className="bg-emerald-500/10 rounded p-2">🌍 /api/public/*</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Direct Booking Tab */}
                {activeTab === "booking" && (
                    <div className="space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Direct Booking Pages
                                </CardTitle>
                                <CardDescription>
                                    Allow guests to book directly - save on OTA commissions!
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                                    <h4 className="font-medium text-emerald-600 mb-2">💰 Save 3-15% on Fees</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Direct bookings skip Airbnb, Booking.com, and VRBO commissions.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Your Booking URLs</h4>
                                    <div className="space-y-2">
                                        {properties.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No properties found. Create a property first.</p>
                                        ) : (
                                            properties.map((prop) => (
                                                <div key={prop.id} className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg group">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{prop.name}</p>
                                                        <code className="text-xs text-muted-foreground">
                                                            {typeof window !== 'undefined' ? window.location.origin : ''}/book/{prop.slug || prop.id}
                                                        </code>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => window.open(`/book/${prop.slug || prop.id}`, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(`${window.location.origin}/book/${prop.slug || prop.id}`)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">How It Works</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            Guests see property details, rooms, and pricing
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            They select dates and submit an inquiry form
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            You receive the inquiry via email (if configured)
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            No login required for guests - frictionless experience
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                    <h4 className="font-medium text-amber-600 flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Database Migration Required
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Run this SQL in Neon to enable direct booking:
                                    </p>
                                    <div className="bg-black/20 rounded p-3 font-mono text-xs overflow-x-auto">
                                        {`-- Add slug column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
UPDATE properties SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

-- Create booking inquiries table
CREATE TABLE IF NOT EXISTS booking_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);`}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-3"
                                        onClick={() => copyToClipboard(`-- Add slug column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
UPDATE properties SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

-- Create booking inquiries table
CREATE TABLE IF NOT EXISTS booking_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);`)}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy SQL
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
