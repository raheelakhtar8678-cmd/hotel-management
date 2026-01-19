"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Copy, CheckCircle2, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    const [copied, setCopied] = useState(false);

    const migrationSQL = `-- Database Migration: Add Amenities and Images
-- Run this SQL in your Neon/Vercel Postgres dashboard

-- Add amenities column to rooms (stores JSON array of amenity IDs)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities TEXT;

-- Add images column to rooms (stores JSON array of image URLs - up to 5)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS images TEXT;

-- Add images column to properties (stores JSON array of image URLs - up to 5)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT;

-- Optional: Remove old image_url columns if they exist
-- Uncomment these if you previously had image_url columns:
-- ALTER TABLE rooms DROP COLUMN IF EXISTS image_url;
-- ALTER TABLE properties DROP COLUMN IF EXISTS image_url;`;

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
