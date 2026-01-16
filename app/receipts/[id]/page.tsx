'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, RefreshCw } from "lucide-react";

export default function ReceiptPage() {
    const params = useParams();
    const id = params.id as string;
    const [booking, setBooking] = useState<any>(null);
    const [extras, setExtras] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchBookingDetails();
        }
    }, [id]);

    const fetchBookingDetails = async () => {
        setLoading(true);
        try {
            // Fetch booking
            const bookingRes = await fetch(`/api/bookings?id=${id}`);
            const bookingData = await bookingRes.json();

            if (bookingData.success && bookingData.booking) {
                setBooking(bookingData.booking);

                // Fetch extras for this booking
                const extrasRes = await fetch(`/api/room-extras?booking_id=${id}`);
                const extrasData = await extrasRes.json();
                if (extrasData.success) {
                    setExtras(extrasData.extras || []);
                }
            }
        } catch (error) {
            console.error('Error fetching receipt:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
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

    if (!booking) {
        return (
            <div className="flex-1 p-8 pt-6">
                <div className="max-w-2xl mx-auto text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Receipt Not Found</h2>
                    <p className="text-muted-foreground">The booking receipt you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const roomTotal = booking.total_paid || 0;
    const extrasTotal = extras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
    const subtotal = roomTotal;
    const tax = subtotal * 0.1;
    const total = subtotal;

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Print Buttons - Hide when printing */}
                <div className="flex justify-between items-center print:hidden">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight gradient-text">Receipt</h2>
                        <p className="text-muted-foreground mt-1">Booking confirmation and payment details</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Receipt Content */}
                <Card className="glass-card">
                    <CardContent className="p-8 space-y-6">
                        {/* Header */}
                        <div className="text-center border-b pb-6">
                            <h1 className="text-3xl font-bold mb-2">HOTEL MANAGEMENT SYSTEM</h1>
                            <p className="text-muted-foreground">Booking Receipt</p>
                        </div>

                        {/* Receipt Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Receipt Number</p>
                                <p className="font-mono font-semibold">RCP-{id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground">Date Issued</p>
                                <p className="font-semibold">
                                    {new Date(booking.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Guest & Property Info */}
                        <div className="grid md:grid-cols-2 gap-6 border-b pb-6">
                            <div>
                                <h3 className="font-semibold mb-2">Guest Information</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">{booking.guest_name}</p>
                                    {booking.guest_email && (
                                        <p className="text-muted-foreground">{booking.guest_email}</p>
                                    )}
                                    <p className="text-muted-foreground">{booking.guests || 1} Guest(s)</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Property Information</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">{booking.property_name}</p>
                                    <p className="text-muted-foreground">Room: {booking.room_type}</p>
                                    {booking.address && (
                                        <p className="text-muted-foreground text-xs">{booking.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stay Details */}
                        <div className="border-b pb-6">
                            <h3 className="font-semibold mb-3">Stay Details</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Check-in</p>
                                    <p className="font-semibold">{checkIn.toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Check-out</p>
                                    <p className="font-semibold">{checkOut.toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Nights</p>
                                    <p className="font-semibold">{nights}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charges */}
                        <div className="border-b pb-6">
                            <h3 className="font-semibold mb-4">Charges</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Room ({nights} night{nights > 1 ? 's' : ''})</span>
                                    <span className="font-medium">${roomTotal.toFixed(2)}</span>
                                </div>

                                {extras.length > 0 && (
                                    <>
                                        <div className="text-sm font-semibold text-muted-foreground mt-4">Extras:</div>
                                        {extras.map((extra) => (
                                            <div key={extra.id} className="flex justify-between text-sm pl-4">
                                                <span className="text-muted-foreground">
                                                    {extra.item_name} (×{extra.quantity})
                                                </span>
                                                <span className="font-medium">
                                                    ${(extra.price * extra.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-lg font-bold">
                                <span>TOTAL PAID</span>
                                <span className="text-emerald-600">${total.toFixed(2)}</span>
                            </div>
                            <div className="text-center pt-4">
                                <Badge variant="outline" className="text-sm">
                                    Status: {booking.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-sm text-muted-foreground pt-6 border-t">
                            <p>Thank you for your stay!</p>
                            <p className="text-xs mt-2">
                                For any questions, please contact us at support@hotelmanagement.com
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
