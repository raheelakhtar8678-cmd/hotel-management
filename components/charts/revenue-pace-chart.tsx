"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

interface MonthlyData {
    month: string;
    thisYear: number;
    lastYear: number;
}

export function RevenuePaceChart() {
    const [chartData, setChartData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenueData();
    }, []);

    const fetchRevenueData = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                const bookings = data.bookings || [];

                // Get current year and last year
                const now = new Date();
                const currentYear = now.getFullYear();
                const lastYear = currentYear - 1;

                // Initialize monthly data
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthlyData: { [key: string]: { thisYear: number; lastYear: number } } = {};

                months.forEach(month => {
                    monthlyData[month] = { thisYear: 0, lastYear: 0 };
                });

                // Group bookings by month
                bookings.forEach((booking: any) => {
                    if (!booking.check_in || !booking.total_paid) return;

                    const checkIn = new Date(booking.check_in);
                    const year = checkIn.getFullYear();
                    const monthIndex = checkIn.getMonth();
                    const monthName = months[monthIndex];
                    const amount = Number(booking.total_paid) || 0;

                    if (year === currentYear) {
                        monthlyData[monthName].thisYear += amount;
                    } else if (year === lastYear) {
                        monthlyData[monthName].lastYear += amount;
                    }
                });

                // Convert to array, only show months up to current month if current year
                const currentMonth = now.getMonth();
                const result: MonthlyData[] = months
                    .slice(0, currentMonth + 2) // Show up to next month
                    .map(month => ({
                        month,
                        thisYear: monthlyData[month].thisYear,
                        lastYear: monthlyData[month].lastYear
                    }));

                // If no data, show at least 6 months with zeros
                if (result.every(r => r.thisYear === 0 && r.lastYear === 0)) {
                    setChartData(months.slice(0, 6).map(month => ({
                        month,
                        thisYear: 0,
                        lastYear: 0
                    })));
                } else {
                    setChartData(result);
                }
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error);
            // Fallback to empty data
            setChartData(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
                month,
                thisYear: 0,
                lastYear: 0
            })));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading revenue data...
            </div>
        );
    }

    const hasData = chartData.some(d => d.thisYear > 0 || d.lastYear > 0);

    return (
        <ResponsiveContainer width="100%" height={300}>
            {!hasData ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p>No revenue data yet</p>
                    <p className="text-sm mt-1">Create bookings to see revenue trends</p>
                </div>
            ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #6366f1',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                        }}
                        formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, '']}
                    />
                    <Legend
                        wrapperStyle={{ color: '#94a3b8', fontSize: '14px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="thisYear"
                        stroke="#6366f1"
                        strokeWidth={3}
                        name="This Year"
                        dot={{ fill: '#6366f1', r: 4 }}
                        activeDot={{ r: 6 }}
                        fill="url(#colorThisYear)"
                    />
                    <Line
                        type="monotone"
                        dataKey="lastYear"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Last Year"
                        dot={{ fill: '#94a3b8', r: 3 }}
                        fill="url(#colorLastYear)"
                    />
                </LineChart>
            )}
        </ResponsiveContainer>
    );
}
