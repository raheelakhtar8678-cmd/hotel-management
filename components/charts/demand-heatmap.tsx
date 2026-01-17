"use client";

import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from 'react';

interface DayData {
    date: Date;
    day: number;
    month: string;
    weekday: string;
    demand: number;
    bookingCount: number;
}

export function DemandHeatmap() {
    const [demandData, setDemandData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRooms, setTotalRooms] = useState(0);

    useEffect(() => {
        fetchDemandData();
    }, []);

    const fetchDemandData = async () => {
        try {
            // Fetch bookings and rooms
            const [bookingsRes, roomsRes] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/rooms')
            ]);

            const bookingsData = await bookingsRes.json();
            const roomsData = await roomsRes.json();

            const bookings = bookingsData.bookings || [];
            const rooms = roomsData.rooms || [];
            setTotalRooms(rooms.length);

            // Generate 30 days of demand data
            const data: DayData[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];

                // Count bookings for this date (where date is between check_in and check_out)
                const bookingsOnDate = bookings.filter((b: any) => {
                    const checkIn = new Date(b.check_in);
                    const checkOut = new Date(b.check_out);
                    checkIn.setHours(0, 0, 0, 0);
                    checkOut.setHours(0, 0, 0, 0);
                    return date >= checkIn && date < checkOut;
                });

                // Calculate occupancy percentage as demand
                // If no rooms, use random demand + weekend bonus
                let demand = 0;
                if (rooms.length > 0) {
                    demand = Math.round((bookingsOnDate.length / rooms.length) * 100);
                } else {
                    // Fallback: simulate demand based on day of week
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const baseDemand = isWeekend ? 65 : 45;
                    demand = Math.round(baseDemand + Math.random() * 25 - 10);
                }

                // Cap at 100%
                demand = Math.min(100, Math.max(0, demand));

                data.push({
                    date: date,
                    day: date.getDate(),
                    month: date.toLocaleDateString('en-US', { month: 'short' }),
                    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    demand: demand,
                    bookingCount: bookingsOnDate.length
                });
            }

            setDemandData(data);
        } catch (error) {
            console.error('Error fetching demand data:', error);
            // Generate fallback data
            generateFallbackData();
        } finally {
            setLoading(false);
        }
    };

    const generateFallbackData = () => {
        const data: DayData[] = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const baseDemand = isWeekend ? 65 : 45;
            const demand = Math.round(baseDemand + Math.random() * 30 - 15);

            data.push({
                date: date,
                day: date.getDate(),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
                demand: Math.min(100, Math.max(0, demand)),
                bookingCount: 0
            });
        }
        setDemandData(data);
    };

    // Get demand level and color
    const getDemandLevel = (demand: number) => {
        if (demand >= 80) return { level: 'Very High', color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500/30' };
        if (demand >= 60) return { level: 'High', color: 'bg-orange-500', textColor: 'text-orange-500', borderColor: 'border-orange-500/30' };
        if (demand >= 40) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-500/30' };
        return { level: 'Low', color: 'bg-emerald-500', textColor: 'text-emerald-500', borderColor: 'border-emerald-500/30' };
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">30-Day Demand Forecast</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Loading demand data...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">30-Day Demand Forecast</h3>
                <div className="flex gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                        <span className="text-muted-foreground">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                        <span className="text-muted-foreground">Med</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                        <span className="text-muted-foreground">High</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                        <span className="text-muted-foreground">Very High</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {demandData.map((day, index) => {
                    const demandInfo = getDemandLevel(day.demand);
                    const isToday = index === 0;
                    const isWeekend = day.weekday === 'Sat' || day.weekday === 'Sun';

                    return (
                        <div
                            key={index}
                            className={`
                relative p-3 rounded-lg border transition-all
                ${demandInfo.borderColor}
                ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                hover:scale-105
                cursor-pointer
              `}
                            style={{
                                backgroundColor: `${demandInfo.color}15`,
                            }}
                            title={`${day.weekday} ${day.month} ${day.day}: ${day.demand}% occupancy - ${demandInfo.level}${day.bookingCount > 0 ? ` (${day.bookingCount} bookings)` : ''}`}
                        >
                            {/* Date Badge */}
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {day.weekday}
                                </span>
                                <span className={`text-lg font-bold ${demandInfo.textColor}`}>
                                    {day.day}
                                </span>
                                {index === 0 && (
                                    <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-primary/30 text-primary">
                                        Today
                                    </Badge>
                                )}
                                {!isToday && isWeekend && (
                                    <span className="text-xs text-muted-foreground">
                                        🌟
                                    </span>
                                )}
                            </div>

                            {/* Demand Percentage */}
                            <div className="mt-2 text-center">
                                <div className={`text-sm font-semibold ${demandInfo.textColor}`}>
                                    {day.demand}%
                                </div>
                            </div>

                            {/* Visual Bar */}
                            <div className="mt-2 h-1 bg-secondary/30 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${demandInfo.color} transition-all`}
                                    style={{ width: `${day.demand}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="pt-4 border-t border-border/50">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-red-500">
                            {demandData.filter(d => d.demand >= 80).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Very High Days</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-orange-500">
                            {demandData.filter(d => d.demand >= 60 && d.demand < 80).length}
                        </div>
                        <div className="text-xs text-muted-foreground">High Days</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-yellow-500">
                            {demandData.filter(d => d.demand >= 40 && d.demand < 60).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Medium Days</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-500">
                            {demandData.filter(d => d.demand < 40).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Low Days</div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                    💡 <strong className="text-foreground">Pricing Tip:</strong>
                    {totalRooms > 0
                        ? ` You have ${totalRooms} rooms. High demand days (orange/red) are optimal for surge pricing.`
                        : ' Add rooms to see demand based on actual bookings.'
                    }
                </p>
            </div>
        </div>
    );
}
