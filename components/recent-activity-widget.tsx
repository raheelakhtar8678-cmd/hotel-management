"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";

interface ActivityItem {
    id: string;
    type: 'booking' | 'price_update' | 'property_added' | 'rule_created';
    title?: string;
    description: string;
    timestamp: string;
    icon: any;
    color: string;
}

export function RecentActivityWidget() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    useEffect(() => {
        // Mock activity data - in production, fetch from API
        setActivities([
            {
                id: '1',
                type: 'booking',
                title: 'New Booking',
                description: 'Grand Hotel - 3 nights ($450)',
                timestamp: '2 hours ago',
                icon: Calendar,
                color: 'text-emerald-500'
            },
            {
                id: '2',
                type: 'price_update',
                title: 'Price Adjusted',
                description: 'Weekend Premium rule applied (+20%)',
                timestamp: '5 hours ago',
                icon: TrendingUp,
                color: 'text-primary'
            },
            {
                id: '3',
                type: 'property_added',
                description: 'Beach Villa added to portfolio',
                timestamp: '1 day ago',
                icon: Users,
                color: 'text-cyan-500'
            },
            {
                id: '4',
                type: 'rule_created',
                title: 'New Rule Created',
                description: 'Last-Minute Discount activated',
                timestamp: '2 days ago',
                icon: DollarSign,
                color: 'text-amber-500'
            }
        ]);
    }, []);

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
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
                                    {activity.title && (
                                        <p className="font-medium text-sm">{activity.title}</p>
                                    )}
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
            </CardContent>
        </Card>
    );
}
