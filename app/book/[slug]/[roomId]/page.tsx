'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingCalculatorModal } from "@/components/BookingCalculatorModal";
import {
    ArrowLeft, MapPin, Users, BedDouble, Loader2, Share2,
    Copy, CheckCircle2, Wifi, Coffee, Car, Snowflake, Tv,
    Bath, Utensils, Waves, Dumbbell, Star
} from "lucide-react";

interface Room {
    id: string;
    name: string;
    type: string;
    description: string;
    basePrice: number;
    imageUrl: string;
    images: string[];
    maxGuests: number;
    amenities: string[];
    status: string;
    bedType: string;
    size: string;
    floor: string;
    property: {
        id: string;
        name: string;
        slug: string;
        address: string;
        city: string;
        country: string;
        currency: string;
    };
}

interface Extra {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
}

// Amenity icons
const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    coffee: <Coffee className="h-4 w-4" />,
    parking: <Car className="h-4 w-4" />,
    ac: <Snowflake className="h-4 w-4" />,
    tv: <Tv className="h-4 w-4" />,
    bathroom: <Bath className="h-4 w-4" />,
    kitchen: <Utensils className="h-4 w-4" />,
    pool: <Waves className="h-4 w-4" />,
    gym: <Dumbbell className="h-4 w-4" />,
};

export default function RoomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const slug = params.slug as string;

    const [room, setRoom] = useState<Room | null>(null);
    const [extras, setExtras] = useState<Extra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await fetch(`/api/public/room/${roomId}`);
                const data = await res.json();

                if (data.success) {
                    setRoom(data.room);
                    setExtras(data.extras || []);
                } else {
                    setError(data.error || 'Room not found');
                }
            } catch (err) {
                setError('Failed to load room');
            } finally {
                setLoading(false);
            }
        };

        if (roomId) {
            fetchRoom();
        }
    }, [roomId]);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: room?.name,
                    text: `Check out ${room?.name} at ${room?.property.name}`,
                    url
                });
            } catch (err) {
                // User cancelled or error
            }
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleBookingComplete = (booking: any) => {
        setShowBookingModal(false);
        router.push(`/book/confirmation/${booking.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                <Card className="max-w-md text-center p-8">
                    <BedDouble className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Link href="/book">
                        <Button>Browse Properties</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href={`/book/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                        Back to {room.property.name}
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                        {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                        {copied ? 'Copied!' : 'Share'}
                    </Button>
                </div>
            </div>

            {/* Room Image */}
            <div className="relative h-64 md:h-96 bg-gradient-to-br from-primary/20 to-cyan-500/20">
                {room.imageUrl ? (
                    <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BedDouble className="h-24 w-24 text-primary/30" />
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <Badge className="bg-white/20 text-white mb-2">{room.property.name}</Badge>
                    <h1 className="text-3xl font-bold text-white">{room.name}</h1>
                    <div className="flex items-center gap-2 text-white/80 mt-1">
                        <MapPin className="h-4 w-4" />
                        {[room.property.city, room.property.country].filter(Boolean).join(', ')}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Room Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-4">
                            <Badge variant="secondary" className="text-sm py-1 px-3">
                                <BedDouble className="h-4 w-4 mr-2" />
                                {room.bedType || room.type}
                            </Badge>
                            <Badge variant="secondary" className="text-sm py-1 px-3">
                                <Users className="h-4 w-4 mr-2" />
                                Up to {room.maxGuests} guests
                            </Badge>
                            {room.size && (
                                <Badge variant="secondary" className="text-sm py-1 px-3">
                                    {room.size}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="text-sm py-1 px-3">
                                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                                4.9
                            </Badge>
                        </div>

                        {/* Description */}
                        {room.description && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="font-bold text-lg mb-3">About this room</h2>
                                    <p className="text-muted-foreground">{room.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Amenities */}
                        {room.amenities && room.amenities.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="font-bold text-lg mb-4">Amenities</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {room.amenities.map((amenity, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                                                {amenityIcons[amenity.toLowerCase()] || <CheckCircle2 className="h-4 w-4 text-primary" />}
                                                <span className="text-sm capitalize">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Extras */}
                        {extras.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="font-bold text-lg mb-4">Available Extras</h2>
                                    <div className="space-y-3">
                                        {extras.map((extra) => (
                                            <div key={extra.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{extra.name}</p>
                                                    {extra.description && (
                                                        <p className="text-sm text-muted-foreground">{extra.description}</p>
                                                    )}
                                                </div>
                                                <Badge variant="outline">${extra.price}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Booking Card */}
                    <div>
                        <Card className="sticky top-24 shadow-xl">
                            <CardContent className="p-6">
                                <div className="text-center mb-6">
                                    <div className="text-3xl font-bold text-primary">
                                        ${room.basePrice}
                                    </div>
                                    <div className="text-muted-foreground text-sm">per night</div>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-primary to-cyan-500 py-6 text-lg"
                                    onClick={() => setShowBookingModal(true)}
                                >
                                    Book Now
                                </Button>

                                <p className="text-xs text-muted-foreground text-center mt-4">
                                    No booking fees • Free cancellation
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <BookingCalculatorModal
                open={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                room={{
                    id: room.id,
                    name: room.name,
                    basePrice: room.basePrice,
                    maxGuests: room.maxGuests,
                    property: {
                        name: room.property.name,
                        currency: room.property.currency
                    }
                }}
                extras={extras}
                onBookingComplete={handleBookingComplete}
            />

            {/* Footer */}
            <footer className="bg-white border-t py-6 text-center mt-12">
                <p className="text-muted-foreground text-sm">
                    Direct booking powered by <span className="font-semibold text-primary">YieldVibe</span>
                </p>
            </footer>
        </div>
    );
}
