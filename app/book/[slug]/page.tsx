'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Building2, MapPin, Users, Calendar, Wifi, Coffee,
    Car, Snowflake, Tv, CheckCircle2, Send, Loader2,
    BedDouble, Star, ChevronRight, ArrowRight, ArrowLeft, History
} from "lucide-react";

interface Room {
    id: string;
    name: string;
    type: string;
    basePrice: number;
    imageUrl: string;
    maxGuests: number;
    amenities: string[];
    status: string;
}

interface Property {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    description: string;
    image_url: string;
    currency: string;
}

// Amenity icon mapping
const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    coffee: <Coffee className="h-4 w-4" />,
    parking: <Car className="h-4 w-4" />,
    ac: <Snowflake className="h-4 w-4" />,
    tv: <Tv className="h-4 w-4" />,
};

export default function BookingPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [property, setProperty] = useState<Property | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await fetch(`/api/public/property/${slug}`);
                const data = await res.json();

                if (data.success) {
                    setProperty(data.property);
                    setRooms(data.rooms);
                } else {
                    setError(data.error || 'Property not found');
                }
            } catch (err) {
                setError('Failed to load property');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchProperty();
        }
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch('/api/public/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: property?.id,
                    room_id: selectedRoom,
                    guest_name: guestName,
                    guest_email: guestEmail,
                    guest_phone: guestPhone,
                    check_in: checkIn,
                    check_out: checkOut,
                    guests,
                    message
                })
            });

            const data = await res.json();

            if (data.success) {
                setSubmitted(true);
            } else {
                alert(data.error || 'Failed to submit inquiry');
            }
        } catch (err) {
            alert('Failed to submit inquiry');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate nights
    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const nights = calculateNights();
    const selectedRoomData = rooms.find(r => r.id === selectedRoom);
    const estimatedTotal = selectedRoomData ? selectedRoomData.basePrice * nights : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
                        <p className="text-muted-foreground">{error || 'This property does not exist or is unavailable.'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                <Card className="max-w-md text-center">
                    <CardContent className="pt-8 pb-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Inquiry Sent!</h2>
                        <p className="text-muted-foreground mb-6">
                            Thank you for your interest in {property.name}.
                            The property owner will contact you shortly.
                        </p>
                        <Button onClick={() => setSubmitted(false)} variant="outline">
                            Send Another Inquiry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Hero Section */}
            <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary to-cyan-500">
                {property.image_url && (
                    <img
                        src={property.image_url}
                        alt={property.name}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                        <Badge className="bg-white/20 text-white mb-4">Book Direct & Save</Badge>
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{property.name}</h1>
                        <div className="flex items-center justify-center gap-2 text-white/90">
                            <MapPin className="h-4 w-4" />
                            <span>{property.city}, {property.country}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 -mt-16 relative z-10">
                {/* Navigation links */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/book" className="flex items-center gap-2 text-muted-foreground hover:text-foreground bg-white/80 backdrop-blur px-3 py-2 rounded-lg">
                        <ArrowLeft className="h-4 w-4" />
                        All Properties
                    </Link>
                    <Link href="/book/history" className="flex items-center gap-2 text-muted-foreground hover:text-foreground bg-white/80 backdrop-blur px-3 py-2 rounded-lg">
                        <History className="h-4 w-4" />
                        My Bookings
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Rooms List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold mb-4">Available Rooms</h2>

                        {rooms.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No rooms available at this time.
                                </CardContent>
                            </Card>
                        ) : (
                            rooms.map(room => (
                                <Card
                                    key={room.id}
                                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedRoom === room.id
                                        ? 'ring-2 ring-primary shadow-lg'
                                        : ''
                                        }`}
                                    onClick={() => setSelectedRoom(room.id)}
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Room Image */}
                                        <div className="w-full md:w-48 h-40 md:h-auto flex-shrink-0">
                                            {room.imageUrl ? (
                                                <img
                                                    src={room.imageUrl}
                                                    alt={room.name}
                                                    className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-t-none">
                                                    <BedDouble className="h-12 w-12 text-primary/50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Room Details */}
                                        <div className="flex-1 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{room.name}</h3>
                                                    <p className="text-sm text-muted-foreground capitalize">{room.type}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary">
                                                        ${room.basePrice}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">per night</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    Up to {room.maxGuests} guests
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-4 w-4 text-yellow-500" />
                                                    4.9
                                                </span>
                                            </div>

                                            {/* Amenities */}
                                            <div className="flex flex-wrap gap-2">
                                                {(room.amenities || []).slice(0, 5).map((amenity, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {amenityIcons[amenity.toLowerCase()] || null}
                                                        <span className="ml-1 capitalize">{amenity}</span>
                                                    </Badge>
                                                ))}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-3 flex items-center justify-between">
                                                {selectedRoom === room.id ? (
                                                    <div className="flex items-center text-primary text-sm font-medium">
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Selected
                                                    </div>
                                                ) : (
                                                    <div></div>
                                                )}
                                                <Link
                                                    href={`/book/${slug}/${room.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Button size="sm" variant="outline" className="text-xs">
                                                        View Details <ArrowRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-primary to-cyan-500 text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Request to Book
                                </CardTitle>
                                <CardDescription className="text-white/80">
                                    Book direct and save on fees
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Check-in</Label>
                                            <Input
                                                type="date"
                                                value={checkIn}
                                                onChange={(e) => setCheckIn(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Check-out</Label>
                                            <Input
                                                type="date"
                                                value={checkOut}
                                                onChange={(e) => setCheckOut(e.target.value)}
                                                min={checkIn || new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Guests</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={selectedRoomData?.maxGuests || 10}
                                            value={guests}
                                            onChange={(e) => setGuests(parseInt(e.target.value))}
                                        />
                                    </div>

                                    <hr className="my-4" />

                                    <div className="space-y-1">
                                        <Label className="text-xs">Your Name *</Label>
                                        <Input
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="John Smith"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Email *</Label>
                                        <Input
                                            type="email"
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Phone (optional)</Label>
                                        <Input
                                            type="tel"
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Message (optional)</Label>
                                        <Input
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Any special requests?"
                                        />
                                    </div>

                                    {/* Price Summary */}
                                    {selectedRoom && nights > 0 && (
                                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>${selectedRoomData?.basePrice} x {nights} nights</span>
                                                <span>${estimatedTotal}</span>
                                            </div>
                                            <div className="flex justify-between font-bold pt-2 border-t">
                                                <span>Estimated Total</span>
                                                <span className="text-primary">${estimatedTotal}</span>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-primary to-cyan-500"
                                        disabled={submitting || !selectedRoom}
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        {submitting ? 'Sending...' : 'Send Inquiry'}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        No payment required - the owner will confirm your booking
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t mt-12 py-6 text-center text-sm text-muted-foreground">
                <p>Direct booking powered by YieldVibe</p>
            </footer>
        </div>
    );
}
