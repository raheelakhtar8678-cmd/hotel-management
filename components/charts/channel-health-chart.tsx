"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChannelHealthChartProps {
    data?: Array<{
        name: string;
        value: number;
        commission: number;
    }>;
}

export function ChannelHealthChart({ data }: ChannelHealthChartProps) {
    // Mock data if none provided
    const chartData = data || [
        { name: 'Booking.com', value: 49800, commission: 0.18 },
        { name: 'Expedia', value: 37350, commission: 0.15 },
        { name: 'Direct', value: 37350, commission: 0 },
    ];

    const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4'];

    const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);
    const otaRevenue = chartData
        .filter(item => item.commission > 0)
        .reduce((sum, item) => sum + item.value, 0);
    const totalCommission = chartData.reduce(
        (sum, item) => sum + (item.value * item.commission),
        0
    );
    const directRevenue = chartData.find(item => item.commission === 0)?.value || 0;
    const commissionSaved = directRevenue * 0.17; // Assumed 17% avg OTA commission

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Channel Health</h3>

            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #6366f1',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                        }}
                        formatter={(value: number | undefined) => value ? [`$${value.toLocaleString()}`, ''] : ['', '']}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                        formatter={(value) => <span className="text-foreground">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="glass-card p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Direct Booking %</div>
                    <div className="text-2xl font-bold text-primary">
                        {((directRevenue / totalRevenue) * 100).toFixed(0)}%
                    </div>
                </div>
                <div className="glass-card p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Commission Saved</div>
                    <div className="text-2xl font-bold text-emerald-500">
                        ${commissionSaved.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="text-xs text-muted-foreground">
                <p>💡 Tip: Increasing direct bookings by 10% could save you ${(commissionSaved * 0.1).toLocaleString()} more in OTA fees!</p>
            </div>
        </div>
    );
}
