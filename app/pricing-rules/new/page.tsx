"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Zap, Info } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const RULE_TEMPLATES = {
    last_minute_7: {
        ruleType: 'last_minute',
        name: 'Last-Minute Boost (7 Days)',
        conditions: { days_before_checkin: 7, discount_percent: 15 },
        action: { type: 'discount', value: 15, unit: 'percent' }
    },
    last_minute_3: {
        ruleType: 'last_minute',
        name: 'Last-Minute Aggressive (3 Days)',
        conditions: { days_before_checkin: 3, discount_percent: 25 },
        action: { type: 'discount', value: 25, unit: 'percent' }
    },
    weekly_discount: {
        ruleType: 'length_of_stay',
        name: 'Weekly Stay Discount',
        conditions: { min_length: 7, discount_percent: 10 },
        action: { type: 'discount', value: 10, unit: 'percent' }
    },
    monthly_discount: {
        ruleType: 'length_of_stay',
        name: 'Monthly Stay Discount',
        conditions: { min_length: 30, discount_percent: 20 },
        action: { type: 'discount', value: 20, unit: 'percent' }
    },
    weekend_premium: {
        ruleType: 'weekend',
        name: 'Weekend Premium (Fri-Sat)',
        conditions: { days_of_week: [5, 6], surge_percent: 20 },
        action: { type: 'surge', value: 20, unit: 'percent' }
    },
    high_season: {
        ruleType: 'seasonal',
        name: 'High Season Premium',
        conditions: { season: 'high', surge_percent: 30 },
        action: { type: 'surge', value: 30, unit: 'percent' }
    },
    low_season: {
        ruleType: 'seasonal',
        name: 'Low Season Discount',
        conditions: { season: 'low', discount_percent: 15 },
        action: { type: 'discount', value: 15, unit: 'percent' }
    },
    event_surge: {
        ruleType: 'event_based',
        name: 'Event Surge Pricing',
        conditions: { event: 'major', surge_percent: 40 },
        action: { type: 'surge', value: 40, unit: 'percent' }
    },
    gap_night: {
        ruleType: 'gap_night',
        name: 'Gap Night Auto-Fill',
        conditions: { gap_nights: 1, discount_percent: 30 },
        action: { type: 'discount', value: 30, unit: 'percent' }
    },
    orphan_day: {
        ruleType: 'orphan_day',
        name: 'Orphan Day Protection',
        conditions: { min_length: 2 },
        action: { type: 'surge', value: 0, unit: 'percent' } // Logic rule, mostly restriction
    },
};

import { Suspense } from 'react';

function PricingRuleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams.get('template');

    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        property_id: '',
        rule_type: 'last_minute',
        action_type: 'discount',
        action_value: '15',
        priority: '0',
        is_active: 'true',
        // Conditions
        days_before_checkin: '7',
        min_nights: '',
        max_nights: '',
        days_of_week: '',
        date_from: '',
        date_to: '',
    });

    useEffect(() => {
        fetchProperties();

        // Load template if specified
        if (templateId && RULE_TEMPLATES[templateId as keyof typeof RULE_TEMPLATES]) {
            const template = RULE_TEMPLATES[templateId as keyof typeof RULE_TEMPLATES];
            setFormData(prev => ({
                ...prev,
                name: template.name,
                rule_type: template.ruleType,
                action_type: template.action.type,
                action_value: template.action.value.toString(),
                days_before_checkin: (template.conditions as any).days_before_checkin?.toString() || '',
                min_nights: (template.conditions as any).min_length?.toString() || '',
            }));
        }
    }, [templateId]);

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties');
            const data = await response.json();
            setProperties(data.properties || []);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const conditions: any = {};
        const action: any = {
            type: formData.action_type,
            value: Number(formData.action_value),
            unit: 'percent'
        };

        // Build conditions based on rule type
        if (formData.rule_type === 'last_minute' && formData.days_before_checkin) {
            conditions.days_before_checkin = Number(formData.days_before_checkin);
            conditions.discount_percent = Number(formData.action_value);
        }

        if (formData.rule_type === 'length_of_stay') {
            if (formData.min_nights) conditions.min_length = Number(formData.min_nights);
            if (formData.max_nights) conditions.max_length = Number(formData.max_nights);
            conditions.discount_percent = Number(formData.action_value);
        }

        if (formData.rule_type === 'weekend' && formData.days_of_week) {
            conditions.days_of_week = formData.days_of_week.split(',').map(d => Number(d.trim()));
            conditions.surge_percent = Number(formData.action_value);
        }

        if (formData.rule_type === 'seasonal') {
            if (formData.date_from) conditions.date_from = formData.date_from;
            if (formData.date_to) conditions.date_to = formData.date_to;
            conditions.surge_percent = Number(formData.action_value);
        }

        try {
            const response = await fetch('/api/pricing-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: formData.property_id,
                    name: formData.name,
                    rule_type: formData.rule_type,
                    priority: Number(formData.priority),
                    is_active: formData.is_active === 'true',
                    conditions,
                    action,
                    date_from: formData.date_from || null,
                    date_to: formData.date_to || null,
                }),
            });

            if (response.ok) {
                router.push('/pricing-rules');
            } else {
                alert('Failed to create pricing rule');
            }
        } catch (error) {
            console.error('Error creating rule:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/pricing-rules">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Rules
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                        Create Pricing Rule
                    </h2>
                    <p className="text-muted-foreground">
                        Automate your pricing strategy with intelligent rules
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Define the rule name and scope</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Rule Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Last-Minute Weekend Discount"
                                    required
                                    className="bg-input border-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="property_id">Property *</Label>
                                <Select
                                    value={formData.property_id}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value }))}
                                    required
                                >
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue placeholder="Select a property" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map((property) => (
                                            <SelectItem key={property.id} value={property.id}>
                                                {property.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rule_type">Rule Type *</Label>
                                    <Select
                                        value={formData.rule_type}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, rule_type: value }))}
                                    >
                                        <SelectTrigger className="bg-input border-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="last_minute">Last-Minute Discount</SelectItem>
                                            <SelectItem value="length_of_stay">Length of Stay</SelectItem>
                                            <SelectItem value="weekend">Weekend/Day of Week</SelectItem>
                                            <SelectItem value="seasonal">Seasonal</SelectItem>
                                            <SelectItem value="gap_night">Gap Night</SelectItem>
                                            <SelectItem value="event_based">Event-Based</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority Level</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                        className="bg-input border-primary/20"
                                    />
                                    <p className="text-xs text-muted-foreground">Higher number = higher priority</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rule Conditions */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Rule Conditions</CardTitle>
                            <CardDescription>When should this rule apply?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Last-Minute Conditions */}
                            {formData.rule_type === 'last_minute' && (
                                <div className="space-y-2">
                                    <Label htmlFor="days_before_checkin">Days Before Check-In *</Label>
                                    <Input
                                        id="days_before_checkin"
                                        type="number"
                                        min="1"
                                        value={formData.days_before_checkin}
                                        onChange={(e) => setFormData(prev => ({ ...prev, days_before_checkin: e.target.value }))}
                                        placeholder="7"
                                        required
                                        className="bg-input border-primary/20"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Apply when booking is made within X days of check-in
                                    </p>
                                </div>
                            )}

                            {/* Length of Stay Conditions */}
                            {formData.rule_type === 'length_of_stay' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="min_nights">Minimum Nights</Label>
                                        <Input
                                            id="min_nights"
                                            type="number"
                                            min="1"
                                            value={formData.min_nights}
                                            onChange={(e) => setFormData(prev => ({ ...prev, min_nights: e.target.value }))}
                                            placeholder="7"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_nights">Maximum Nights</Label>
                                        <Input
                                            id="max_nights"
                                            type="number"
                                            min="1"
                                            value={formData.max_nights}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_nights: e.target.value }))}
                                            placeholder="30"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Weekend/Day of Week Conditions */}
                            {formData.rule_type === 'weekend' && (
                                <div className="space-y-2">
                                    <Label htmlFor="days_of_week">Days of Week *</Label>
                                    <Input
                                        id="days_of_week"
                                        value={formData.days_of_week}
                                        onChange={(e) => setFormData(prev => ({ ...prev, days_of_week: e.target.value }))}
                                        placeholder="5,6"
                                        required
                                        className="bg-input border-primary/20"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Comma-separated (0=Sunday, 6=Saturday). E.g., "5,6" for Fri-Sat
                                    </p>
                                </div>
                            )}

                            {/* Seasonal Conditions */}
                            {formData.rule_type === 'seasonal' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date_from">Start Date</Label>
                                        <Input
                                            id="date_from"
                                            type="date"
                                            value={formData.date_from}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date_from: e.target.value }))}
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date_to">End Date</Label>
                                        <Input
                                            id="date_to"
                                            type="date"
                                            value={formData.date_to}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date_to: e.target.value }))}
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Configuration */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Price Adjustment</CardTitle>
                            <CardDescription>How should prices be modified?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="action_type">Adjustment Type *</Label>
                                    <Select
                                        value={formData.action_type}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value }))}
                                    >
                                        <SelectTrigger className="bg-input border-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="discount">Discount (Lower Price)</SelectItem>
                                            <SelectItem value="surge">Surge (Increase Price)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="action_value">
                                        {formData.action_type === 'discount' ? 'Discount' : 'Increase'} Percentage *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="action_value"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={formData.action_value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, action_value: e.target.value }))}
                                            required
                                            className="bg-input border-primary/20 pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary/30 rounded-lg p-4 flex items-start gap-3">
                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium mb-1">Preview:</p>
                                    <p className="text-muted-foreground">
                                        {formData.action_type === 'discount' ? 'Reduce' : 'Increase'} base price by{' '}
                                        <span className="font-bold text-foreground">{formData.action_value}%</span>
                                        {'. '}
                                        Example: $100 → ${formData.action_type === 'discount'
                                            ? (100 - (100 * Number(formData.action_value) / 100)).toFixed(0)
                                            : (100 + (100 * Number(formData.action_value) / 100)).toFixed(0)
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="is_active">Rule Status</Label>
                                <Select
                                    value={formData.is_active}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                                >
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Active</Badge>
                                                <span>Rule will apply immediately</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="false">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">Inactive</Badge>
                                                <span>Save as draft</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <Link href="/pricing-rules" className="flex-1">
                            <Button variant="outline" type="button" className="w-full">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-primary hover:opacity-90"
                            disabled={loading}
                        >
                            {loading ? (
                                'Creating Rule...'
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Create Pricing Rule
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NewPricingRulePage() {
    return (
        <Suspense fallback={<div className="p-8">Loading form...</div>}>
            <PricingRuleForm />
        </Suspense>
    );
}
