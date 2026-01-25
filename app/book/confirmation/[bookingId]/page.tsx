'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2, Calendar, Users, MapPin, Printer, Download,
    Share2, Copy, ArrowLeft, Loader2, Mail, Phone, User,
    BedDouble, Clock, Receipt
} from "lucide-react";

interface Booking {
    id: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guests: number;
    totalAmount: number;
    status: string;
    room: {
        name: string;
        imageUrl?: string;
    };
    property: {
        name: string;
        address?: string;
        city?: string;
        country?: string;
        currency: string;
    };
    breakdown?: {
        basePrice: number;
        nights: number;
        weekendSurcharge: number;
        extras: { name: string; price: number; quantity: number }[];
        taxes: { name: string; amount: number }[];
    };
    createdAt: string;
}

export default function BookingConfirmationPage() {
    const params = useParams();
    const bookingId = params.bookingId as string;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await fetch(`/api/public/booking/${bookingId}`);
                const data = await res.json();

                if (data.success) {
                    setBooking(data.booking);
                } else {
                    setError(data.error || 'Booking not found');
                }
            } catch (err) {
                setError('Failed to load booking');
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Booking Confirmation',
                    text: `Booking at ${booking?.property.name}`,
                    url
                });
            } catch (err) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                <Card className="max-w-md text-center p-8">
                    <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Link href="/book">
                        <Button>Browse Properties</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 print:bg-white">
            {/* Header - hide on print */}
            <div className="bg-white border-b print:hidden">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/book" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                        Back to Properties
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleShare}>
                            {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                            {copied ? 'Copied!' : 'Share'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Content */}
            <div className="container mx-auto px-4 py-8 max-w-2xl" ref={receiptRef}>
                {/* Success Header */}
                <div className="text-center mb-8 print:mb-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 print:w-16 print:h-16">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 print:h-8 print:w-8" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 print:text-2xl">Booking Confirmed!</h1>
                    <p className="text-muted-foreground">
                        A confirmation email has been sent to {booking.guestEmail}
                    </p>
                </div>

                {/* Receipt Card */}
                <Card className="shadow-xl print:shadow-none print:border">
                    <CardHeader className="bg-gradient-to-r from-primary to-cyan-500 text-white print:bg-gray-100 print:text-black">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Booking Receipt</CardTitle>
                                <p className="text-white/80 text-sm print:text-gray-600">
                                    Confirmation #{booking.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <Badge className={`${booking.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                                {booking.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Property & Room */}
                        <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                {booking.room.imageUrl ? (
                                    <img src={booking.room.imageUrl} alt={booking.room.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BedDouble className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{booking.property.name}</h3>
                                <p className="text-muted-foreground">{booking.room.name}</p>
                                {booking.property.city && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {[booking.property.city, booking.property.country].filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Check-in</p>
                                <p className="font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {formatDate(booking.checkIn)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Check-out</p>
                                <p className="font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {formatDate(booking.checkOut)}
                                </p>
                            </div>
                        </div>

                        {/* Guest Info */}
                        <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Guest Details</h4>
                            <div className="space-y-1">
                                <p className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {booking.guestName}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {booking.guestEmail}
                                </p>
                                {booking.guestPhone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {booking.guestPhone}
                                    </p>
                                )}
                                <p className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                                </p>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Price Breakdown</h4>

                            {booking.breakdown ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>${booking.breakdown.basePrice} × {booking.breakdown.nights} nights</span>
                                        <span>${(booking.breakdown.basePrice * booking.breakdown.nights).toFixed(2)}</span>
                                    </div>
                                    {booking.breakdown.weekendSurcharge > 0 && (
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Weekend surcharge</span>
                                            <span>+${booking.breakdown.weekendSurcharge.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {booking.breakdown.extras?.map((extra, i) => (
                                        <div key={i} className="flex justify-between text-sm text-muted-foreground">
                                            <span>{extra.name} × {extra.quantity}</span>
                                            <span>+${(extra.price * extra.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {booking.breakdown.taxes?.map((tax, i) => (
                                        <div key={i} className="flex justify-between text-sm text-muted-foreground">
                                            <span>{tax.name}</span>
                                            <span>+${tax.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            <div className="flex justify-between font-bold text-xl pt-3 border-t mt-3">
                                <span>Total</span>
                                <span className="text-primary">${booking.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Booking Time */}
                        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                            <p className="flex items-center justify-center gap-2">
                                <Clock className="h-4 w-4" />
                                Booked on {formatDate(booking.createdAt)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions - hide on print */}
                <div className="mt-6 text-center print:hidden">
                    <Link href="/book/history">
                        <Button variant="outline">
                            View All My Bookings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Footer - hide on print */}
            <footer className="bg-white border-t py-6 text-center mt-12 print:hidden">
                <p className="text-muted-foreground text-sm">
                    Direct booking powered by <span className="font-semibold text-primary">YieldVibe</span>
                </p>
            </footer>
        </div>
    );
}
