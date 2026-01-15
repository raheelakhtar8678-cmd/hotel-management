"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Database, Key, CheckCircle2, XCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [settings, setSettings] = useState({
        floor_price: '',
        ceiling_price: '',
        openai_key: '',
        gemini_key: '',
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        checkConnection();
        loadSettings();
    }, []);

    const checkConnection = async () => {
        setConnectionStatus('checking');
        try {
            const response = await fetch('/api/properties');
            const data = await response.json();
            setConnectionStatus(data.success ? 'connected' : 'disconnected');
        } catch (error) {
            setConnectionStatus('disconnected');
        }
    };

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.settings) {
                    const settingsMap: any = {};
                    data.settings.forEach((s: any) => {
                        settingsMap[s.key] = s.value;
                    });
                    setSettings({
                        floor_price: settingsMap.floor_price || '99',
                        ceiling_price: settingsMap.ceiling_price || '400',
                        openai_key: settingsMap.openai_key || '',
                        gemini_key: settingsMap.gemini_key || '',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);

        // Get values directly from inputs to test what the user just typed
        const url = (document.getElementById('supabaseUrl') as HTMLInputElement).value;
        const service = (document.getElementById('supabaseServiceKey') as HTMLInputElement).value; // Use service key for admin test
        const anon = (document.getElementById('supabaseAnonKey') as HTMLInputElement).value;

        if (!url || !service) {
            alert("Please enter at least the Project URL and Service Role Key to test.");
            setTesting(false);
            return;
        }

        try {
            const res = await fetch('/api/setup/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supabaseUrl: url,
                    supabaseAnonKey: anon,
                    supabaseServiceKey: service
                })
            });
            const data = await res.json();

            if (data.success) {
                setConnectionStatus('connected');
                alert("Connection Successful! ✅\n\nYou can now click 'Save Connection Settings' to apply these changes.");
            } else {
                setConnectionStatus('disconnected');
                alert(`Connection Failed ❌\n\nError: ${data.error}\n\nPlease check your keys and URL.`);
            }
        } catch (e: any) {
            alert(`Test failed: ${e.message}`);
            setConnectionStatus('disconnected');
        } finally {
            setTesting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const getEnvExample = () => {
        return `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-key
CRON_SECRET=your-cron-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres`;
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                    Settings
                </h2>
                <p className="text-muted-foreground">
                    Configure your YieldVibe instance and API connections
                </p>
            </div>

            <div className="max-w-4xl space-y-6">
                {/* Database Connection Status & Setup */}
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                <CardTitle>Database Connection</CardTitle>
                            </div>
                            {connectionStatus === 'connected' && (
                                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Connected
                                </Badge>
                            )}
                            {connectionStatus === 'disconnected' && (
                                <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Disconnected
                                </Badge>
                            )}
                            {connectionStatus === 'checking' && (
                                <Badge variant="outline">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Checking...
                                </Badge>
                            )}
                        </div>
                        <CardDescription>Configure your Supabase connection</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {connectionStatus === 'connected' ? (
                            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
                                <p className="text-sm font-semibold text-emerald-500 mb-2">
                                    ✅ Successfully Connected
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Your Supabase database is active.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                                    onClick={async () => {
                                        if (!confirm("This will create all necessary tables if they don't exist. Continue?")) return;
                                        try {
                                            const pass = (document.getElementById('dbPassword') as HTMLInputElement).value;
                                            const url = (document.getElementById('supabaseUrl') as HTMLInputElement).value;
                                            // Sanitize the manual string if present
                                            let manualString = (document.getElementById('connectionString') as HTMLInputElement)?.value?.trim();

                                            // FIX: Users often copy the brackets [password] from docs. Remove them.
                                            // Regex looks for :[... content ...]@ and removes the brackets.
                                            if (manualString && manualString.includes(':[') && manualString.includes(']@')) {
                                                console.log("Detected brackets in password, cleaning...");
                                                manualString = manualString.replace(/:\[([^\]]+)\]@/, ':$1@');
                                                // Update the input to show the fixed version
                                                (document.getElementById('connectionString') as HTMLInputElement).value = manualString;
                                                alert("Fixed: I removed the square brackets [] from your password. Trying again...");
                                            }

                                            // Construct DB URL
                                            let connectionString = manualString;
                                            if (!connectionString && url && pass) {
                                                const projectRef = url.replace('https://', '').replace('.supabase.co', '');
                                                connectionString = `postgresql://postgres:${pass}@db.${projectRef}.supabase.co:5432/postgres`;
                                            }

                                            if (connectionString && connectionString.includes('db.') && connectionString.includes('.supabase.co')) {
                                                // Suggest Pooler if using direct connection (which fails on Vercel sometimes due to IPv6)
                                                console.log("Using direct DB connection. Pooler is preferred.");
                                            }

                                            alert("Initializing database schema... Please wait.");
                                            const res = await fetch('/api/setup/schema', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ connectionString })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                alert("Database initialized successfully! 🎉\n\nYou can now create properties and bookings.");
                                            } else {
                                                alert("Setup failed: " + data.error);
                                            }
                                        } catch (e: any) {
                                            alert("Error: " + e.message);
                                        }
                                    }}
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Initialize / Repair Tables
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                                <p className="text-sm font-semibold text-amber-500 mb-2">
                                    ⚠️ Connection Required
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Enter your Supabase credentials below to connect.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4 border-t pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="supabaseUrl">Project URL</Label>
                                <Input
                                    id="supabaseUrl"
                                    placeholder="https://your-project.supabase.co"
                                    defaultValue={process.env.NEXT_PUBLIC_SUPABASE_URL}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="supabaseAnonKey">Anon Public Key</Label>
                                <Input
                                    id="supabaseAnonKey"
                                    type="password"
                                    placeholder="your-anon-key"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="supabaseServiceKey">Service Role Key (Secret)</Label>
                                <Input
                                    id="supabaseServiceKey"
                                    type="password"
                                    placeholder="your-service-role-key"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dbPassword">Database Password</Label>
                                <Input
                                    id="dbPassword"
                                    type="password"
                                    placeholder="Your database password (for connection string)"
                                />
                                <p className="text-xs text-muted-foreground">Required to generate the DATABASE_URL connection string.</p>
                            </div>

                            <div className="grid gap-2 pt-2 border-t border-dashed">
                                <Label htmlFor="connectionString" className="flex items-center gap-2">
                                    Manual Connection String
                                    <Badge variant="outline" className="text-[10px] h-4">Optional</Badge>
                                </Label>
                                <Input
                                    id="connectionString"
                                    placeholder="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
                                    className="font-mono text-xs"
                                />
                                <p className="text-xs text-muted-foreground">
                                    If you get DNS errors, paste the full connection string from Supabase here (Settings → Database).
                                </p>
                            </div>

                            <Button
                                onClick={async () => {
                                    // Check if we are on localhost
                                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                                    const url = (document.getElementById('supabaseUrl') as HTMLInputElement).value;
                                    const anon = (document.getElementById('supabaseAnonKey') as HTMLInputElement).value;
                                    const service = (document.getElementById('supabaseServiceKey') as HTMLInputElement).value;
                                    const pass = (document.getElementById('dbPassword') as HTMLInputElement).value;
                                    const manualString = (document.getElementById('connectionString') as HTMLInputElement).value;

                                    // Calculate DB URL
                                    let dbUrl = "";
                                    if (manualString) {
                                        dbUrl = manualString;
                                    } else if (url && pass) {
                                        const projectRef = url.replace('https://', '').replace('.supabase.co', '');
                                        dbUrl = `postgresql://postgres:${pass}@db.${projectRef}.supabase.co:5432/postgres`;
                                    }

                                    // If on Vercel/Production, we can't write to files.
                                    // Show instructions instead.
                                    if (!isLocalhost) {
                                        const envBlock = `NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_SERVICE_ROLE_KEY=${service}
DATABASE_URL=${dbUrl}
CRON_SECRET=${Math.random().toString(36).substring(7)}`;

                                        alert("ℹ️ You are on the Live Site (Vercel).\n\n" +
                                            "You cannot write to files here. You must set these variables in the Vercel Dashboard.\n\n" +
                                            "1. Go to Vercel Project Settings → Environment Variables\n" +
                                            "2. Copy and paste these values:\n\n" +
                                            "--- COPY BELOW ---\n" + envBlock + "\n------------------\n\n" +
                                            "I have copied this to your clipboard!");

                                        navigator.clipboard.writeText(envBlock);
                                        return;
                                    }

                                    setSaving(true);
                                    try {
                                        const res = await fetch('/api/setup/env', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                supabaseUrl: url,
                                                supabaseAnonKey: anon,
                                                supabaseServiceKey: service,
                                                dbPassword: pass,
                                                connectionString: manualString
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            alert("Configuration saved! The server will restart automatically. Please wait 5 seconds and refresh the page.");
                                            setTimeout(() => window.location.reload(), 5000);
                                        } else {
                                            alert("Failed: " + data.error);
                                        }
                                    } catch (e: any) {
                                        alert("Error saving configuration: " + e.message);
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Saving..." : "Save Connection Settings"}
                            </Button>
                        </div>

                        <Button
                            onClick={testConnection}
                            disabled={testing}
                            variant="outline"
                            className="w-full mt-2"
                        >
                            {testing ? 'Testing...' : 'Test Connection'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Price Limits */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Price Limits</CardTitle>
                        <CardDescription>Set global min/max price constraints</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="floor_price">Minimum Price (Floor)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="floor_price"
                                        type="number"
                                        min="0"
                                        value={settings.floor_price}
                                        onChange={(e) => setSettings(prev => ({ ...prev, floor_price: e.target.value }))}
                                        className="pl-7"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Prices won't go below this amount
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ceiling_price">Maximum Price (Ceiling)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="ceiling_price"
                                        type="number"
                                        min="0"
                                        value={settings.ceiling_price}
                                        onChange={(e) => setSettings(prev => ({ ...prev, ceiling_price: e.target.value }))}
                                        className="pl-7"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Prices won't go above this amount
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Keys */}
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-primary" />
                            <CardTitle>API Keys (Optional)</CardTitle>
                        </div>
                        <CardDescription>Configure third-party integrations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="openai_key">OpenAI API Key</Label>
                            <Input
                                id="openai_key"
                                type="password"
                                value={settings.openai_key}
                                onChange={(e) => setSettings(prev => ({ ...prev, openai_key: e.target.value }))}
                                placeholder="sk-..."
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                For AI insights generation. Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary underline">OpenAI</a>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gemini_key">Google Gemini API Key</Label>
                            <Input
                                id="gemini_key"
                                type="password"
                                value={settings.gemini_key}
                                onChange={(e) => setSettings(prev => ({ ...prev, gemini_key: e.target.value }))}
                                placeholder="AI..."
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Alternative AI provider. Get your key at <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-primary underline">Google AI Studio</a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                    onClick={saveSettings}
                    disabled={saving || connectionStatus === 'disconnected'}
                    className="w-full bg-gradient-primary hover:opacity-90"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>

                {connectionStatus === 'disconnected' && (
                    <p className="text-xs text-center text-muted-foreground">
                        Connect database first to save settings
                    </p>
                )}
            </div>
        </div>
    );
}
