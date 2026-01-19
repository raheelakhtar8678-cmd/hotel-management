"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Copy, CheckCircle2, Settings as SettingsIcon, Percent, Trash2, Plus } from "lucide-react";

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

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            fetchTaxes(selectedProperty);
        }
    }, [selectedProperty]);

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
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
            </div>
        </div>
    );
}
