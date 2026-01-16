'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    MapPin,
    DollarSign,
    Users,
    Bed,
    Bath,
    TrendingUp,
    ArrowLeft,
    Edit,
    Archive,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PageProps) {
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyId, setPropertyId] = useState<string>('');

    useEffect(() => {
        params.then(({ id }) => {
            setPropertyId(id);
            fetchPropertyDetails(id);
        });
    }, [params]);

    const fetchPropertyDetails = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/properties?id=${id}`);
            const data = await response.json();

            if (data.success && data.property) {
                setProperty(data.property);
                // Fetch rooms separately
                const roomsResponse = await fetch(`/api/rooms?property_id=${id}`);
                const roomsData = await roomsResponse.json();
                if (roomsData.success) {
                    setRooms(roomsData.rooms || []);
                }
            } else {
                router.push('/properties');
            }
        } catch (error) {
            console.error('Error fetching property:', error);
            router.push('/properties');
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

    if (!property) {
        return null;
    }

    const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
    const avgOccupancy = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;
    const totalRevenue = rooms.reduce((sum, r) => sum + (r.current_price || 0), 0);

    return (
        <div className="flex-1 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/properties">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Properties
                    </Button>
                </Link>
            </div>

            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight gradient-text">
                            {property.name}
                        </h2>
                        <Badge variant="outline" className="text-sm">
                            {property.property_type || 'hotel'}
                        </Badge>
                    </div>
                    {property.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{property.city}, {property.country || 'USA'}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link href={`/properties/${propertyId}/edit`}>
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Property
                        </Button>
                    </Link>
                    <Button variant="outline" className="text-red-500 hover:text-red-600">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                    </Button>
                </div>
            </div>

            {/* Property Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                        <Building2 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rooms.length}</div>
                        <p className="text-xs text-muted-foreground">Active listings</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                        <Users className="h-5 w-5 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgOccupancy}%</div>
                        <p className="text-xs text-muted-foreground">Currently booked</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Base Price</CardTitle>
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${property.base_price}</div>
                        <p className="text-xs text-muted-foreground">Per night</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue}</div>
                        <p className="text-xs text-muted-foreground">All rooms</p>
                    </CardContent>
                </Card>
            </div>

            {/* Property Details */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Property Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Property Type</span>
                            <span className="font-medium capitalize">{property.property_type || 'N/A'}</span>
                        </div>
                        {property.bedrooms && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Bed className="h-4 w-4" />
                                    Bedrooms
                                </span>
                                <span className="font-medium">{property.bedrooms}</span>
                            </div>
                        )}
                        {property.bathrooms && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Bath className="h-4 w-4" />
                                    Bathrooms
                                </span>
                                <span className="font-medium">{property.bathrooms}</span>
                            </div>
                        )}
                        {property.max_guests && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Max Guests
                                </span>
                                <span className="font-medium">{property.max_guests}</span>
                            </div>
                        )}
                        {property.address && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Address</span>
                                <span className="font-medium text-right text-sm">{property.address}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Pricing Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Base Nightly Rate</span>
                            <span className="font-bold text-lg text-emerald-500">${property.base_price}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Min Price</span>
                            <span className="font-medium">${property.min_price}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Max Price</span>
                            <span className="font-medium">${property.max_price}</span>
                        </div>
                        <Link href="/pricing-rules">
                            <Button variant="outline" className="w-full" size="sm">
                                Manage Pricing Rules
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Rooms List */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Rooms ({rooms.length})</CardTitle>
                        <Link href={`/inventory?property=${propertyId}`}>
                            <Button variant="outline" size="sm">
                                View All in Inventory
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {rooms.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No rooms added yet</p>
                            <Link href={`/inventory?property=${propertyId}`}>
                                <Button className="mt-4" size="sm">
                                    Add Rooms
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {rooms.slice(0, 5).map((room: any) => (
                                <div
                                    key={room.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded">
                                            <Building2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{room.type || 'Standard Room'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                ID: {room.id.slice(0, 8)}...
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-500">
                                            ${room.current_price || property.base_price}
                                        </p>
                                        <Badge variant={room.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                                            {room.status || 'available'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {rooms.length > 5 && (
                                <Link href={`/inventory?property=${propertyId}`}>
                                    <Button variant="ghost" className="w-full" size="sm">
                                        View all {rooms.length} rooms →
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
