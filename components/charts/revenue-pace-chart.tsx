"use client";

import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

type ViewType = 'daily' | 'weekly' | 'yearly';

interface ChartData {
    label: string;
    thisYear: number;
    lastYear: number;
}

interface RevenuePaceChartProps {
    propertyId?: string;
}

export function RevenuePaceChart({ propertyId }: RevenuePaceChartProps) {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<ViewType>('daily');
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [propertyId]); // Re-fetch when property changes

    useEffect(() => {
        if (bookings.length > 0) {
            processDataForView(viewType);
        }
    }, [viewType, bookings]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const url = propertyId && propertyId !== 'all'
                ? `/api/bookings?property_id=${propertyId}`
                : '/api/bookings';

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setBookings(data.bookings);
                processDataForView(viewType, data.bookings);
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    const processDataForView = (view: ViewType, bookingsData?: any[]) => {
        const data = bookingsData || bookings;
        const now = new Date();
        const currentYear = now.getFullYear();
        const lastYear = currentYear - 1;

        if (view === 'daily') {
            // Last 14 days
            const days: ChartData[] = [];
            for (let i = 13; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const targetYMD = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

                const dayRevenue = data
                    .filter((b: any) => b.check_in === targetYMD)
                    .reduce((sum: number, b: any) => sum + (Number(b.total_paid) || 0), 0);

                // Last year same day
                const lastYearDate = new Date(date);
                lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
                const lastYearYMD = lastYearDate.toLocaleDateString('en-CA');

                const lastYearRevenue = data
                    .filter((b: any) => b.check_in === lastYearYMD)
                    .reduce((sum: number, b: any) => sum + (Number(b.total_paid) || 0), 0);

                days.push({ label: dateLabel, thisYear: dayRevenue, lastYear: lastYearRevenue });
            }
            setChartData(days);
        } else if (view === 'weekly') {
            // Last 8 weeks
            const weeks: ChartData[] = [];
            for (let i = 7; i >= 0; i--) {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const weekLabel = `Week ${8 - i}`;
                const startYMD = weekStart.toLocaleDateString('en-CA');
                const endYMD = weekEnd.toLocaleDateString('en-CA');

                const weekRevenue = data
                    .filter((b: any) => b.check_in >= startYMD && b.check_in <= endYMD)
                    .reduce((sum: number, b: any) => sum + (Number(b.total_paid) || 0), 0);

                // Last year same week
                const lastYearWeekStart = new Date(weekStart);
                lastYearWeekStart.setFullYear(lastYearWeekStart.getFullYear() - 1);
                const lastYearWeekEnd = new Date(lastYearWeekStart);
                lastYearWeekEnd.setDate(lastYearWeekEnd.getDate() + 6);

                const lyStartYMD = lastYearWeekStart.toLocaleDateString('en-CA');
                const lyEndYMD = lastYearWeekEnd.toLocaleDateString('en-CA');

                const lastYearRevenue = data
                    .filter((b: any) => b.check_in >= lyStartYMD && b.check_in <= lyEndYMD)
                    .reduce((sum: number, b: any) => sum + (Number(b.total_paid) || 0), 0);

                weeks.push({ label: weekLabel, thisYear: weekRevenue, lastYear: lastYearRevenue });
            }
            setChartData(weeks);
        } else {
            // Monthly (yearly view)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyData: { [key: string]: { thisYear: number; lastYear: number } } = {};

            months.forEach(month => {
                monthlyData[month] = { thisYear: 0, lastYear: 0 };
            });

            data.forEach((booking: any) => {
                if (!booking.check_in || !booking.total_paid) return;

                // Parse YYYY-MM-DD manually to avoid timezone
                const [y, m, d] = booking.check_in.split('-').map(Number);
                const year = y;
                const monthName = months[m - 1]; // m is 1-12
                const amount = Number(booking.total_paid) || 0;

                if (year === currentYear) {
                    monthlyData[monthName].thisYear += amount;
                } else if (year === lastYear) {
                    monthlyData[monthName].lastYear += amount;
                }
            });

            const currentMonth = now.getMonth();
            const result: ChartData[] = months
                .slice(0, currentMonth + 2)
                .map(month => ({
                    label: month,
                    thisYear: monthlyData[month].thisYear,
                    lastYear: monthlyData[month].lastYear
                }));

            setChartData(result.length > 0 ? result : months.slice(0, 6).map(m => ({ label: m, thisYear: 0, lastYear: 0 })));
        }
    };

    if (loading) {
        return (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Loading revenue data...
            </div>
        );
    }

    const hasData = chartData.some(d => d.thisYear > 0 || d.lastYear > 0);

    const renderChart = () => {
        if (!hasData) {
            return (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                    <p>No revenue data yet</p>
                    <p className="text-sm mt-1">Create bookings to see revenue trends</p>
                </div>
            );
        }

        const commonProps = {
            data: chartData,
            margin: { top: 5, right: 30, left: 20, bottom: 5 }
        };

        const tooltipStyle = {
            backgroundColor: '#1e293b',
            border: '1px solid #6366f1',
            borderRadius: '8px',
            color: '#f1f5f9'
        };

        // Daily View - Bar Chart
        if (viewType === 'daily') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, '']} />
                        <Legend />
                        <Bar dataKey="thisYear" name="This Year" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lastYear" name="Last Year" fill="#475569" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        // Weekly View - Area Chart
        if (viewType === 'weekly') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorThisYearArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLastYearArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, '']} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="thisYear"
                            name="This Year"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#colorThisYearArea)"
                        />
                        <Area
                            type="monotone"
                            dataKey="lastYear"
                            name="Last Year"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#colorLastYearArea)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );
        }

        // Yearly View - Line Chart (default)
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart {...commonProps}>
                    <defs>
                        <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, '']} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="thisYear"
                        stroke="#6366f1"
                        strokeWidth={3}
                        name="This Year"
                        dot={{ fill: '#6366f1', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="lastYear"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Last Year"
                        dot={{ fill: '#94a3b8', r: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="space-y-4">
            {/* View Type Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={viewType === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('daily')}
                    className={viewType === 'daily' ? 'bg-gradient-primary' : ''}
                >
                    Daily
                </Button>
                <Button
                    variant={viewType === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('weekly')}
                    className={viewType === 'weekly' ? 'bg-gradient-primary' : ''}
                >
                    Weekly
                </Button>
                <Button
                    variant={viewType === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('yearly')}
                    className={viewType === 'yearly' ? 'bg-gradient-primary' : ''}
                >
                    Yearly
                </Button>
            </div>

            {/* Chart */}
            {renderChart()}

            {/* Chart Type Indicator */}
            <div className="text-xs text-muted-foreground text-center">
                {viewType === 'daily' && '📊 Bar Chart - Last 14 days revenue'}
                {viewType === 'weekly' && '📈 Area Chart - Last 8 weeks revenue'}
                {viewType === 'yearly' && '📉 Line Chart - Monthly comparison'}
            </div>
        </div>
    );
}
