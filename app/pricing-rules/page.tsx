"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, TrendingDown, Calendar as CalendarIcon, Sparkles, Gift, Sunset, Star } from "lucide-react";
import Link from "next/link";
import { ActiveRulesWidget } from "@/components/active-rules-widget";

interface RuleTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    ruleType: string;
    icon: any;
    popular: boolean;
    exampleText: string;
}

const RULE_TEMPLATES: RuleTemplate[] = [
    {
        id: 'last_minute_7',
        name: 'Last-Minute Boost (7 Days)',
        description: 'Automatically discount rooms 7 days before check-in to fill vacancies',
        category: 'beginner',
        ruleType: 'last_minute',
        icon: Zap,
        popular: true,
        exampleText: '15% off for bookings made within 7 days of check-in'
    },
    {
        id: 'last_minute_3',
        name: 'Last-Minute Aggressive (3 Days)',
        description: 'Deeper discount 3 days out for last-minute bookings',
        category: 'beginner',
        ruleType: 'last_minute',
        icon: Zap,
        popular: true,
        exampleText: '25% off for bookings made within 3 days of check-in'
    },
    {
        id: 'weekly_discount',
        name: 'Weekly Stay Discount',
        description: 'Offer 10% off for stays of 7+ nights',
        category: 'beginner',
        ruleType: 'length_of_stay',
        icon: Gift,
        popular: true,
        exampleText: '10% discount for reservations of 7+ nights'
    },
    {
        id: 'monthly_discount',
        name: 'Monthly Stay Discount',
        description: 'Offer 20% off for stays of 30+ nights',
        category: 'advanced',
        ruleType: 'length_of_stay',
        icon: Gift,
        popular: false,
        exampleText: '20% discount for reservations of 30+ nights'
    },
    {
        id: 'weekend_premium',
        name: 'Weekend Premium (Fri-Sat)',
        description: 'Charge 20% more on Friday and Saturday nights',
        category: 'beginner',
        ruleType: 'weekend',
        icon: Star,
        popular: true,
        exampleText: '+20% on weekends (Friday & Saturday)'
    },
    {
        id: 'gap_night',
        name: 'Gap Night Auto-Fill',
        description: 'Discount 1-night gaps between bookings to fill calendar',
        category: 'advanced',
        ruleType: 'gap_night',
        icon: CalendarIcon,
        popular: false,
        exampleText: '30% off for 1-night gaps between reservations'
    },
    {
        id: 'high_season',
        name: 'High Season Premium',
        description: 'Increase prices during peak season',
        category: 'beginner',
        ruleType: 'seasonal',
        icon: Sunset,
        popular: true,
        exampleText: '+30% during high season dates'
    },
    {
        id: 'low_season',
        name: 'Low Season Discount',
        description: 'Reduce prices during slow season to maintain occupancy',
        category: 'beginner',
        ruleType: 'seasonal',
        icon: TrendingDown,
        popular: false,
        exampleText: '-15% during low season dates'
    },
    {
        id: 'event_surge',
        name: 'Event Surge Pricing',
        description: 'Automatically increase prices during local events',
        category: 'advanced',
        ruleType: 'event_based',
        icon: Sparkles,
        popular: false,
        exampleText: '+40% during concerts, conferences, and major events'
    },
    {
        id: 'orphan_day',
        name: 'Orphan Day Protection',
        description: 'Prevent creating 1-day gaps in the calendar',
        category: 'expert',
        ruleType: 'orphan_day',
        icon: CalendarIcon,
        popular: false,
        exampleText: 'Require 2-night minimum if booking would create 1-day gap'
    },
];

export default function PricingRulesPage() {
    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">
                        Pricing Rules
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Automate your pricing strategy with intelligent rules
                    </p>
                </div>
                <Link href="/pricing-rules/new">
                    <Button className="bg-gradient-primary hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Rule
                    </Button>
                </Link>
            </div>

            {/* Active Rules Widget */}
            <div className="mb-8">
                <ActiveRulesWidget />
            </div>

            {/* Beginner Rules */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-semibold">Beginner-Friendly Rules</h3>
                    <Badge variant="outline" className="text-xs">
                        Recommended for new users
                    </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {RULE_TEMPLATES.filter(t => t.category === 'beginner').map((template) => {
                        const Icon = template.icon;
                        return (
                            <Card key={template.id} className="glass-card hover-glow transition-smooth group relative">
                                {template.popular && (
                                    <div className="absolute top-3 right-3">
                                        <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                                            🔥 Popular
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {template.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                        <p className="text-sm font-medium">{template.exampleText}</p>
                                    </div>
                                    <Link href={`/pricing-rules/new?template=${template.id}`}>
                                        <Button
                                            variant="outline"
                                            className="w-full group-hover:bg-primary/10 group-hover:border-primary/30"
                                            size="sm"
                                        >
                                            Use This Template
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Advanced Rules */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-semibold">Advanced Rules</h3>
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-500">
                        For power users
                    </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {RULE_TEMPLATES.filter(t => t.category === 'advanced').map((template) => {
                        const Icon = template.icon;
                        return (
                            <Card key={template.id} className="glass-card hover-glow transition-smooth group">
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-cyan-500/10 p-2 rounded-lg">
                                            <Icon className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {template.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                        <p className="text-sm font-medium">{template.exampleText}</p>
                                    </div>
                                    <Link href={`/pricing-rules/new?template=${template.id}`}>
                                        <Button
                                            variant="outline"
                                            className="w-full group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30"
                                            size="sm"
                                        >
                                            Use This Template
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Expert Rules */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-semibold">Expert Rules</h3>
                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
                        Advanced strategies
                    </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {RULE_TEMPLATES.filter(t => t.category === 'expert').map((template) => {
                        const Icon = template.icon;
                        return (
                            <Card key={template.id} className="glass-card hover-glow transition-smooth group">
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-amber-500/10 p-2 rounded-lg">
                                            <Icon className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {template.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                        <p className="text-sm font-medium">{template.exampleText}</p>
                                    </div>
                                    <Link href={`/pricing-rules/new?template=${template.id}`}>
                                        <Button
                                            variant="outline"
                                            className="w-full group-hover:bg-amber-500/10 group-hover:border-amber-500/30"
                                            size="sm"
                                        >
                                            Use This Template
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
