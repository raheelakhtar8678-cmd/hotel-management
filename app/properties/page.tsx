'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, Users, Plus, Edit, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [avgOccupancy, setAvgOccupancy] = useState(0);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/properties');
            const data = await response.json();

            if (data.success) {
                const props = data.properties || [];
                setProperties(props);

                // Calculate metrics (simplified since we don't have rooms data in this fetch)
                const revenue = props.reduce((sum: number, p: any) => sum + Number(p.base_price || 0), 0);
                setTotalRevenue(revenue);
                setAvgOccupancy(65); // Placeholder
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 pt-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">
                        Properties
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your portfolio of {properties.length} active properties
                    </p>
                </div>
                <Link href="/properties/new">
                    <Button className="bg-gradient-primary hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                    </Button>
                </Link>
            </div>

            {/* Portfolio Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                        <Building2 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{properties.length}</div>
                        <p className="text-xs text-muted-foreground">Active listings</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Occupancy</CardTitle>
                        <Users className="h-5 w-5 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgOccupancy}%</div>
                        <p className="text-xs text-muted-foreground">Across all properties</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Combined nightly rates</p>
                    </CardContent>
                </Card>
            </div>

            {/* Property Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property: any) => {
                    return (
                        <Card key={property.id} className="glass-card hover-glow transition-smooth group">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-1">{property.name}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {property.property_type || 'hotel'}
                                            </Badge>
                                            {property.city && (
                                                <span className="text-xs text-muted-foreground">
                                                    📍 {property.city}, {property.country || 'USA'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/properties/${property.id}/edit`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Property Stats */}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Base Price</p>
                                            <p className="font-semibold">${property.base_price}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Price Range</p>
                                            <p className="font-semibold text-xs">${property.min_price} - ${property.max_price}</p>
                                        </div>
                                    </div>

                                    {/* Property Details */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-primary/10">
                                        {property.bedrooms && (
                                            <span>🛏️ {property.bedrooms} bed</span>
                                        )}
                                        {property.bathrooms && (
                                            <span>🚿 {property.bathrooms} bath</span>
                                        )}
                                        {property.max_guests && (
                                            <span>👥 {property.max_guests} guests</span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/properties/${property.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                View Details
                                            </Button>
                                        </Link>
                                        <Link href={`/inventory?property=${property.id}`}>
                                            <Button variant="outline" size="sm">
                                                <TrendingUp className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {properties.length === 0 && (
                <Card className="glass-card p-12 text-center">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Properties Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Get started by adding your first property to the portfolio
                    </p>
                    <Link href="/properties/new">
                        <Button className="bg-gradient-primary">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Property
                        </Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
