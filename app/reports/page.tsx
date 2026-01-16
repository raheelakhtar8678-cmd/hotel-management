'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { exportRevenueToCSV } from "@/lib/export";

export default function ReportsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            const data = await res.json();
            if (data.success) {
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const calculateRevenue = () => {
        const now = new Date();
        const filtered = bookings.filter(b => {
            const checkIn = new Date(b.check_in);
            if (period === 'daily') {
                return checkIn.toDateString() === now.toDateString();
            } else if (period === 'weekly') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return checkIn >= weekAgo;
            } else {
                return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
            }
        });

        return filtered.reduce((sum, b) => sum + (b.total_paid || 0), 0);
    };

    const handleExport = () => {
        const revenueData = bookings.map(b => ({
            Date: new Date(b.check_in).toLocaleDateString(),
            Guest: b.guest_name,
            Property: b.property_name,
            Revenue: `$${b.total_paid.toFixed(2)}`,
            Status: b.status
        }));
        exportRevenueToCSV(revenueData, period);
    };

    const totalRevenue = calculateRevenue();
    const bookingCount = bookings.length;
    const avgRevenue = bookingCount > 0 ? totalRevenue / bookingCount : 0;

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight gradient-text">
                            Revenue Reports
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Track your revenue performance and trends
                        </p>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    <Button
                        variant={period === 'daily' ? 'default' : 'outline'}
                        onClick={() => setPeriod('daily')}
                    >
                        Daily
                    </Button>
                    <Button
                        variant={period === 'weekly' ? 'default' : 'outline'}
                        onClick={() => setPeriod('weekly')}
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={period === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setPeriod('monthly')}
                    >
                        Monthly
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4" />
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600">
                                ${totalRevenue.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {period.charAt(0).toUpperCase() + period.slice(1)} period
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" />
                                Total Bookings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {bookingCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                All time bookings
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4" />
                                Average Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">
                                ${avgRevenue.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Per booking
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Bookings Table */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {bookings.slice(0, 10).map(booking => (
                                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{booking.guest_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {booking.property_name} • {new Date(booking.check_in).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">${booking.total_paid.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">{booking.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
