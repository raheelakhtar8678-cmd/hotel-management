'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (data.success) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl gradient-text">YieldVibe Admin</CardTitle>
                    <CardDescription>
                        Enter your password to access the dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">Admin Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                'Signing in...'
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                        Set ADMIN_PASSWORD in your environment variables
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
