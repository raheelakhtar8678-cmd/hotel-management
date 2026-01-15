import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminClient } from "@/lib/supabase/admin";
import { Building2, DollarSign, TrendingUp, Users, Plus, Edit, Archive } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function PropertiesPage() {
    let properties = [];
    let totalRevenue = 0;
    let avgOccupancy = 0;

    try {
        const { data: propertiesData, error } = await adminClient
            .from('properties')
            .select('*, rooms(id, status, current_price)')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        properties = propertiesData || [];

        // Calculate portfolio metrics
        let totalRooms = 0;
        let occupiedRooms = 0;
        for (const property of properties) {
            const rooms = property.rooms || [];
            totalRooms += rooms.length;
            occupiedRooms += rooms.filter((r: any) => r.status === 'occupied').length;
            totalRevenue += rooms.reduce((sum: number, r: any) => sum + (r.current_price || 0), 0);
        }
        avgOccupancy = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

    } catch (err) {
        console.warn("Using Mock Data for Properties page");
        properties = [
            {
                id: '1',
                name: 'Grand Hotel Downtown',
                property_type: 'hotel',
                city: 'San Francisco',
                country: 'USA',
                base_price: 150,
                rooms: [{}, {}, {}],
                is_active: true,
                bedrooms: 1,
                bathrooms: 1,
                max_guests: 2,
            },
            {
                id: '2',
                name: 'Beachside Villa',
                property_type: 'villa',
                city: 'Miami',
                country: 'USA',
                base_price: 300,
                rooms: [{}, {}, {}, {}, {}],
                is_active: true,
                bedrooms: 4,
                bathrooms: 3,
                max_guests: 8,
            },
        ];
        totalRevenue = 450;
        avgOccupancy = 65;
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
                    const roomCount = property.rooms?.length || 0;
                    const occupiedCount = property.rooms?.filter((r: any) => r.status === 'occupied').length || 0;
                    const occupancyRate = roomCount > 0 ? ((occupiedCount / roomCount) * 100).toFixed(0) : 0;

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
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Rooms</p>
                                            <p className="font-semibold">{roomCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Occupancy</p>
                                            <p className="font-semibold">{occupancyRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Base Price</p>
                                            <p className="font-semibold">${property.base_price}</p>
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
