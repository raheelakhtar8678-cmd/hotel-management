'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Search, ArrowLeft, Loader2, Calendar, MapPin,
    BedDouble, ExternalLink, Receipt, History, Mail
} from "lucide-react";

interface Booking {
    id: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    room: {
        name: string;
        imageUrl?: string;
    };
    property: {
        name: string;
        city?: string;
        country?: string;
        currency: string;
    };
}

export default function BookingHistoryPage() {
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const res = await fetch(`/api/public/bookings?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            if (data.success) {
                setBookings(data.bookings);
            } else {
                setError(data.error || 'Failed to find bookings');
            }
        } catch (err) {
            setError('Failed to search bookings');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500';
            case 'checked_in': return 'bg-blue-500';
            case 'checked_out': return 'bg-gray-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-amber-500';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4 flex items-center">
                    <Link href="/book" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                        Back to Properties
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {/* Search Section */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Your Booking History</h1>
                    <p className="text-muted-foreground">
                        Enter your email to view all your past and upcoming bookings
                    </p>
                </div>

                <Card className="mb-8">
                    <CardContent className="p-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Email Address
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        className="flex-1"
                                        required
                                    />
                                    <Button type="submit" disabled={loading}>
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                {searched && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <Card className="p-8 text-center">
                                <p className="text-red-500">{error}</p>
                            </Card>
                        ) : bookings.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold mb-2">No Bookings Found</h3>
                                <p className="text-muted-foreground mb-4">
                                    We couldn't find any bookings with this email address.
                                </p>
                                <Link href="/book">
                                    <Button>Browse Properties</Button>
                                </Link>
                            </Card>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold">
                                        {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'} Found
                                    </h2>
                                </div>

                                {bookings.map((booking) => (
                                    <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image */}
                                            <div className="w-full md:w-32 h-32 flex-shrink-0">
                                                {booking.room.imageUrl ? (
                                                    <img
                                                        src={booking.room.imageUrl}
                                                        alt={booking.room.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                                                        <BedDouble className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold">{booking.property.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{booking.room.name}</p>
                                                    </div>
                                                    <Badge className={`${getStatusColor(booking.status)} text-white capitalize`}>
                                                        {booking.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                {booking.property.city && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                                        <MapPin className="h-3 w-3" />
                                                        {[booking.property.city, booking.property.country].filter(Boolean).join(', ')}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4 text-primary" />
                                                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                    <div className="font-bold text-primary">
                                                        ${booking.totalAmount.toFixed(2)}
                                                    </div>
                                                    <Link href={`/book/confirmation/${booking.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            View Receipt
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t py-6 text-center mt-12">
                <p className="text-muted-foreground text-sm">
                    Direct booking powered by <span className="font-semibold text-primary">YieldVibe</span>
                </p>
            </footer>
        </div>
    );
}
