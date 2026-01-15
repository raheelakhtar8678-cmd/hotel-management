"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle, Users } from "lucide-react";
import { useState, useEffect } from "react";

interface AIInsight {
    id: string;
    type: 'event_alert' | 'demand_surge' | 'competitor_update';
    title: string;
    description: string;
    suggested_action: string;
    estimated_revenue_impact: number;
    suggested_price_change?: number;
}

interface AIInsightsPanelProps {
    insights?: AIInsight[];
}

export function AIInsightsPanel({ insights: initialInsights }: AIInsightsPanelProps) {
    const [insights, setInsights] = useState<AIInsight[]>(initialInsights || []);
    const [loading, setLoading] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        // Load insights on mount
        if (!initialInsights || initialInsights.length === 0) {
            loadInsights();
        }
    }, []);

    const loadInsights = async () => {
        try {
            const response = await fetch('/api/ai/generate-insights', {
                method: 'POST'
            });
            const data = await response.json();
            if (data.insights) {
                setInsights(data.insights.map((i: any) => ({
                    id: i.id,
                    type: i.type,
                    title: i.title,
                    description: i.description,
                    suggested_action: i.suggested_action,
                    estimated_revenue_impact: i.estimated_revenue_impact,
                    suggested_price_change: i.suggested_price_change
                })));
            }
        } catch (error) {
            console.error('Failed to load insights:', error);
        }
    };

    const handleGenerateNew = async () => {
        setGenerating(true);
        try {
            await loadInsights();
        } finally {
            setGenerating(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'event_alert':
                return <AlertCircle className="h-5 w-5 text-amber-500" />;
            case 'demand_surge':
                return <TrendingUp className="h-5 w-5 text-emerald-500" />;
            case 'competitor_update':
                return <Users className="h-5 w-5 text-cyan-500" />;
            default:
                return <Sparkles className="h-5 w-5 text-primary" />;
        }
    };

    const handleApprove = async (insightId: string) => {
        setLoading(insightId);
        try {
            const response = await fetch('/api/ai/approve-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ insightId })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Success! ${data.message}. Prices have been updated.`);
                // Remove approved insight from list
                setInsights(prev => prev.filter(i => i.id !== insightId));
            } else {
                alert(`❌ Error: ${data.error || 'Failed to update prices'}`);
            }
        } catch (error) {
            console.error('Failed to approve insight:', error);
            alert('❌ Network error. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="glass-card rounded-xl p-6 space-y-6 h-fit sticky top-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold">AI Revenue Insights</h2>
                </div>
                <Button
                    onClick={handleGenerateNew}
                    disabled={generating}
                    size="sm"
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10"
                >
                    {generating ? '...' : '🔄'}
                </Button>
            </div>

            {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No insights available.</p>
                    <p className="text-sm mt-2">Click refresh to generate new insights.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {insights.map((insight) => (
                        <Card
                            key={insight.id}
                            className="glass transition-smooth hover-glow border-primary/20"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    {getIcon(insight.type)}
                                    <div className="flex-1">
                                        <CardTitle className="text-sm font-semibold">
                                            {insight.title}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    {insight.description}
                                </p>

                                <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                                    <div className="font-medium text-primary mb-1">Suggested Action:</div>
                                    <div className="text-foreground">{insight.suggested_action}</div>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Estimated Impact:</span>
                                    <span className={`font-bold ${insight.estimated_revenue_impact > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {insight.estimated_revenue_impact > 0 ? '+' : ''}${Math.abs(insight.estimated_revenue_impact)}
                                    </span>
                                </div>

                                <Button
                                    onClick={() => handleApprove(insight.id)}
                                    disabled={loading === insight.id}
                                    className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                                >
                                    {loading === insight.id ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Applying...
                                        </span>
                                    ) : (
                                        '✓ One-Click Approve'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="text-xs text-muted-foreground text-center pt-4 border-t border-primary/20">
                <p>🤖 Powered by Gemini AI</p>
            </div>
        </div>
    );
}
