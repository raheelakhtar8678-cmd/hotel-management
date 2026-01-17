"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useState, useEffect } from 'react';

interface ChannelData {
    name: string;
    value: number;
    commission: number;
    [key: string]: string | number;
}

export function ChannelHealthChart() {
    const [chartData, setChartData] = useState<ChannelData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChannelData();
    }, []);

    const fetchChannelData = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                const bookings = data.bookings || [];

                // Group bookings by channel
                const channels: { [key: string]: number } = {
                    'Direct': 0,
                    'Booking.com': 0,
                    'Expedia': 0,
                    'Airbnb': 0,
                    'Other': 0
                };

                bookings.forEach((booking: any) => {
                    const amount = Number(booking.total_paid) || 0;
                    const channel = booking.channel || 'direct';

                    switch (channel) {
                        case 'direct':
                            channels['Direct'] += amount;
                            break;
                        case 'booking_com':
                            channels['Booking.com'] += amount;
                            break;
                        case 'expedia':
                            channels['Expedia'] += amount;
                            break;
                        case 'airbnb':
                            channels['Airbnb'] += amount;
                            break;
                        default:
                            channels['Other'] += amount;
                    }
                });

                // Commission rates by channel
                const commissionRates: { [key: string]: number } = {
                    'Direct': 0,
                    'Booking.com': 0.18,
                    'Expedia': 0.15,
                    'Airbnb': 0.03,
                    'Other': 0.10
                };

                // Build chart data (only include channels with revenue)
                const result: ChannelData[] = [];
                Object.keys(channels).forEach(channel => {
                    if (channels[channel] > 0) {
                        result.push({
                            name: channel,
                            value: channels[channel],
                            commission: commissionRates[channel]
                        });
                    }
                });

                // If no bookings yet, show placeholder
                if (result.length === 0) {
                    result.push({ name: 'No Revenue Yet', value: 1, commission: 0 });
                }

                setChartData(result);
            }
        } catch (error) {
            console.error('Error fetching channel data:', error);
            setChartData([{ name: 'No Data', value: 1, commission: 0 }]);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#06b6d4', '#6366f1', '#8b5cf6', '#f59e0b', '#94a3b8'];

    const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);
    const directRevenue = chartData.find(item => item.name === 'Direct')?.value || 0;
    const totalCommission = chartData.reduce(
        (sum, item) => sum + (item.value * item.commission),
        0
    );
    const commissionSaved = directRevenue * 0.17; // Assumed 17% avg OTA commission

    const directPercent = totalRevenue > 0 ? ((directRevenue / totalRevenue) * 100).toFixed(0) : '0';
    const hasRealData = chartData.length > 0 && !chartData[0].name.includes('No');

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Channel Health</h3>

            {loading ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Loading...
                </div>
            ) : !hasRealData ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-center">
                    <div>
                        <p>No booking revenue yet</p>
                        <p className="text-sm mt-1">Create bookings to see channel breakdown</p>
                    </div>
                </div>
            ) : (
                <>
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
                                {directPercent}%
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
                </>
            )}
        </div>
    );
}
