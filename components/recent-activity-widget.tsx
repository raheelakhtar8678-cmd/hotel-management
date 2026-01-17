"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Home, TrendingUp, Package } from "lucide-react";
import { useState, useEffect } from "react";

interface ActivityItem {
    id: string;
    type: 'booking' | 'property' | 'room' | 'price_update';
    title: string;
    description: string;
    timestamp: string;
    icon: any;
    color: string;
}

export function RecentActivityWidget() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const allActivities: ActivityItem[] = [];

            // Fetch recent bookings
            const bookingsRes = await fetch('/api/bookings?limit=5');
            if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json();
                const bookings = bookingsData.bookings || [];
                bookings.slice(0, 3).forEach((booking: any) => {
                    allActivities.push({
                        id: `booking-${booking.id}`,
                        type: 'booking',
                        title: 'New Booking',
                        description: `${booking.guest_name || 'Guest'} - $${booking.total_paid || 0}`,
                        timestamp: formatTime(booking.created_at),
                        icon: Calendar,
                        color: 'text-emerald-500'
                    });
                });
            }

            // Fetch recent properties
            const propsRes = await fetch('/api/properties');
            if (propsRes.ok) {
                const propsData = await propsRes.json();
                const properties = propsData.properties || [];
                properties.slice(0, 2).forEach((prop: any) => {
                    allActivities.push({
                        id: `prop-${prop.id}`,
                        type: 'property',
                        title: 'Property Added',
                        description: `${prop.name} - Base $${prop.base_price}/night`,
                        timestamp: formatTime(prop.created_at),
                        icon: Home,
                        color: 'text-cyan-500'
                    });
                });
            }

            // Fetch recent rooms 
            const roomsRes = await fetch('/api/rooms');
            if (roomsRes.ok) {
                const roomsData = await roomsRes.json();
                const rooms = roomsData.rooms || [];
                rooms.slice(0, 2).forEach((room: any) => {
                    allActivities.push({
                        id: `room-${room.id}`,
                        type: 'room',
                        title: 'Room Created',
                        description: `${room.type} - $${room.current_price}/night`,
                        timestamp: formatTime(room.created_at),
                        icon: Package,
                        color: 'text-purple-500'
                    });
                });
            }

            // Sort by most recent and take top 5
            allActivities.sort((a, b) => {
                // Simple sort - items with "Just now" or "minutes ago" come first
                if (a.timestamp.includes('Just now')) return -1;
                if (b.timestamp.includes('Just now')) return 1;
                return 0;
            });

            setActivities(allActivities.slice(0, 5));
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return 'Recently';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                        No recent activity yet. Add properties and create bookings!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => {
                            const Icon = activity.icon;
                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className={`p-2 rounded-lg bg-secondary ${activity.color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activity.timestamp}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
