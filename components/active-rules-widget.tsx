"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Zap,
    CheckCircle2,
    XCircle,
    Play,
    Trash2,
    Edit,
    MoreVertical
} from "lucide-react";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActiveRule {
    id: string;
    name: string;
    rule_type: string;
    priority: number;
    is_active: boolean;
    property_name?: string;
    properties?: { name: string };
    adjustment_type?: string;
    adjustment_value?: number;
}

export function ActiveRulesWidget() {
    const [rules, setRules] = useState<ActiveRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await fetch('/api/pricing-rules');
            const data = await response.json();

            if (data.success) {
                setRules(data.rules || []);
            }
        } catch (error) {
            console.error('Failed to fetch rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const executeRules = async () => {
        setExecuting(true);
        try {
            const response = await fetch('/api/execute-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.success) {
                alert(`Success! ${data.message}`);
            } else {
                alert('Failed to execute rules');
            }
        } catch (error) {
            console.error('Error executing rules:', error);
            alert('Error executing rules');
        } finally {
            setExecuting(false);
        }
    };

    const toggleRule = async (ruleId: string, currentStatus: boolean) => {
        try {
            const response = await fetch('/api/pricing-rules', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: ruleId,
                    is_active: !currentStatus
                })
            });

            if (response.ok) {
                fetchRules(); // Refresh list
            }
        } catch (error) {
            console.error('Error toggling rule:', error);
        }
    };

    const deleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            const response = await fetch(`/api/pricing-rules?id=${ruleId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchRules(); // Refresh list
            }
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const activeRules = rules.filter(r => r.is_active);
    const inactiveRules = rules.filter(r => !r.is_active);

    if (loading) {
        return (
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Active Pricing Rules
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">Loading rules...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Pricing Rules ({rules.length})
                    </CardTitle>
                    <Button
                        onClick={executeRules}
                        disabled={executing || activeRules.length === 0}
                        size="sm"
                        className="bg-gradient-primary hover:opacity-90"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {executing ? 'Executing...' : 'Execute Now'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {rules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2">No pricing rules created yet</p>
                        <p className="text-sm">Create rules to automate your pricing</p>
                    </div>
                ) : (
                    <>
                        {/* Active Rules */}
                        {activeRules.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <p className="text-sm font-medium">Active ({activeRules.length})</p>
                                </div>
                                {activeRules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm">{rule.name}</p>
                                                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
                                                    Priority {rule.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {rule.properties?.name || 'All Properties'} • {rule.adjustment_type === 'discount' || rule.adjustment_type === 'percentage' && (rule.adjustment_value || 0) < 0 ? '-' : '+'}{Math.abs(rule.adjustment_value || 0)}%
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleRule(rule.id, rule.is_active)}>
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Deactivate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => deleteRule(rule.id)} className="text-red-500">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Inactive Rules */}
                        {inactiveRules.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-medium text-muted-foreground">Inactive ({inactiveRules.length})</p>
                                </div>
                                {inactiveRules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors opacity-60"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm">{rule.name}</p>
                                                <Badge variant="secondary" className="text-xs">
                                                    Priority {rule.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {rule.properties?.name || 'All Properties'} • {rule.adjustment_type === 'discount' || rule.adjustment_type === 'percentage' && (rule.adjustment_value || 0) < 0 ? '-' : '+'}{Math.abs(rule.adjustment_value || 0)}%
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleRule(rule.id, rule.is_active)}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Activate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => deleteRule(rule.id)} className="text-red-500">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
