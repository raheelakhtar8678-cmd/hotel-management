'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Building2, MapPin, BedDouble, Search, Loader2,
    ArrowRight, Star, DollarSign, Home
} from "lucide-react";

interface Property {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    imageUrl: string;
    slug: string;
    propertyType: string;
    currency: string;
    minPrice: number;
    roomCount: number;
}

export default function PublicBookPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch('/api/public/properties');
                const data = await res.json();
                if (data.success) {
                    setProperties(data.properties);
                }
            } catch (error) {
                console.error('Failed to fetch properties:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    const filteredProperties = properties.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-cyan-500 text-white py-16 px-4">
                <div className="container mx-auto text-center">
                    <Badge className="bg-white/20 text-white mb-4">Book Direct & Save</Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Book directly with us and save on booking fees. Browse our properties and find the perfect accommodation for your trip.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by property name, city, or country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 py-6 text-lg bg-white text-foreground rounded-xl shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">
                        {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'} Available
                    </h2>
                </div>

                {filteredProperties.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery ? 'Try a different search term.' : 'No properties are currently available.'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((property) => (
                            <Link
                                key={property.id}
                                href={`/book/${property.slug}`}
                                className="group"
                            >
                                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                                    {/* Property Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-cyan-500/20">
                                        {property.imageUrl ? (
                                            <img
                                                src={property.imageUrl}
                                                alt={property.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 className="h-16 w-16 text-primary/30" />
                                            </div>
                                        )}
                                        <Badge className="absolute top-3 left-3 bg-white/90 text-foreground capitalize">
                                            {property.propertyType || 'Property'}
                                        </Badge>
                                        {property.minPrice > 0 && (
                                            <div className="absolute bottom-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                From ${property.minPrice}/night
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="p-5">
                                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                                            {property.name}
                                        </h3>

                                        {(property.city || property.country) && (
                                            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                                                <MapPin className="h-4 w-4" />
                                                {[property.city, property.country].filter(Boolean).join(', ')}
                                            </div>
                                        )}

                                        {property.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {property.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <BedDouble className="h-4 w-4" />
                                                {property.roomCount} {property.roomCount === 1 ? 'Room' : 'Rooms'}
                                            </div>
                                            <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-white">
                                                View <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t py-8 text-center">
                <p className="text-muted-foreground text-sm">
                    Direct booking powered by <span className="font-semibold text-primary">YieldVibe</span>
                </p>
            </footer>
        </div>
    );
}
