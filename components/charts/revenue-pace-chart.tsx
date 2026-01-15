"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenuePaceChartProps {
    data?: Array<{
        month: string;
        thisYear: number;
        lastYear: number;
    }>;
}

export function RevenuePaceChart({ data }: RevenuePaceChartProps) {
    // Mock data if no real data is provided
    const chartData = data || [
        { month: 'Jan', thisYear: 45000, lastYear: 38000 },
        { month: 'Feb', thisYear: 52000, lastYear: 42000 },
        { month: 'Mar', thisYear: 61000, lastYear: 48000 },
        { month: 'Apr', thisYear: 58000, lastYear: 51000 },
        { month: 'May', thisYear: 67000, lastYear: 55000 },
        { month: 'Jun', thisYear: 75000, lastYear: 62000 },
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
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
        </ResponsiveContainer>
    );
}
