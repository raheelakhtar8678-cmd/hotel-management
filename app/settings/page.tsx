'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Database, RefreshCw, LayoutDashboard, Key } from "lucide-react";

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
                        Database Connection (Vercel Postgres / Neon)
                    </CardTitle>
                    <CardDescription>
                        Native integration with Vercel Storage. No manual setup required.
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
                                Action Required: Connect Database
                            </div>
                            <p className="text-sm text-foreground/80">
                                To use this app on Vercel, you need to connect a database.
                            </p>
                            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-sm font-mono border">
                                1. Go to Vercel Dashboard<br />
                                2. Click "Storage" tab <br />
                                3. Create "Neon" (Postgres)<br />
                                4. Click "Connect" to this project
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => window.open('https://vercel.com/dashboard', '_blank')}>
                                    Open Vercel Dashboard
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

            {/* API Keys */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        AI API Keys (Optional)
                    </CardTitle>
                    <CardDescription>Configure AI providers for automated insights generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Google Gemini API Key</label>
                        <input
                            type="password"
                            placeholder="AIza..."
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm font-mono transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">
                            For AI insights. Get your key at <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-primary underline">Google AI Studio</a>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">OpenAI API Key</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm font-mono transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">
                            Alternative AI provider. Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary underline">OpenAI Platform</a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
