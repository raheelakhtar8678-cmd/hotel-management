"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DemandHeatmap() {
    // Generate 30 days of demand data
    const generateDemandData = () => {
        const data = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Simulate demand based on day of week (higher on weekends)
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Base demand + weekend bonus + some randomness
            const baseDemand = isWeekend ? 70 : 50;
            const demand = Math.min(100, Math.max(20, baseDemand + Math.random() * 30 - 15));

            data.push({
                date: date,
                day: date.getDate(),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
                demand: Math.round(demand),
            });
        }

        return data;
    };

    const demandData = generateDemandData();

    // Get demand level and color
    const getDemandLevel = (demand: number) => {
        if (demand >= 80) return { level: 'Very High', color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500/30' };
        if (demand >= 60) return { level: 'High', color: 'bg-orange-500', textColor: 'text-orange-500', borderColor: 'border-orange-500/30' };
        if (demand >= 40) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-500/30' };
        return { level: 'Low', color: 'bg-emerald-500', textColor: 'text-emerald-500', borderColor: 'border-emerald-500/30' };
    };

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
                            title={`${day.weekday} ${day.month} ${day.day}: ${day.demand}% demand - ${demandInfo.level}`}
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
                    💡 <strong className="text-foreground">Pricing Tip:</strong> High demand days (orange/red) are optimal for surge pricing.
                    Low demand days (green) are good for last-minute discounts.
                </p>
            </div>
        </div>
    );
}
