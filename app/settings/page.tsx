'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Database, RefreshCw, LayoutDashboard } from "lucide-react";

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
                        Database Connection (Vercel Postgres)
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
                                Connected to Vercel Postgres
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
                                3. Create "Vercel Postgres"<br />
                                4. Click "Connect" to this project
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => window.open('https://vercel.com/dashboard', '_blank')}>
                                    Open Vercel Dashboard
                                    <LayoutDashboard className="ml-2 h-4 w-4" />
                                </Button>
                                <Button variant="ghost" onClick={() => window.location.reload()}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Check Connection Again
                                </Button>
                            </div>

                            <div className="pt-4 mt-4 border-t">
                                <details className="text-sm">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        Trouble connecting? Enter manual string
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                        <p className="text-xs text-muted-foreground">
                                            If the Vercel Integration isn't working, paste the connection string from your database provider (Neon/Supabase) here.
                                        </p>
                                        <input
                                            id="manualString"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="postgres://..."
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={async () => {
                                                const str = (document.getElementById('manualString') as HTMLInputElement).value;
                                                if (!str) return alert("Please enter a string");

                                                setLoading(true);
                                                try {
                                                    const res = await fetch('/api/setup/schema', {
                                                        method: 'POST',
                                                        body: JSON.stringify({ connectionString: str })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert("Success! 🎉\n\nIMPORTANT: Now go to Vercel Settings -> Environment Variables and add this string as 'POSTGRES_URL' so the rest of the app works.");
                                                    } else {
                                                        alert("Error: " + data.error);
                                                    }
                                                } catch (e: any) { alert(e.message); }
                                                setLoading(false);
                                            }}
                                        >
                                            Initialize w/ Manual String
                                        </Button>
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
