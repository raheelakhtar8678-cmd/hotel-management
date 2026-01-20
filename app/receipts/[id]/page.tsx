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
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate extras total
    const extrasTotal = extras.reduce((sum, e) => sum + (Number(e.price || 0) * Number(e.quantity || 1)), 0);

    const roomTotal = Number(booking.total_paid) - (Number(booking.tax_total) || 0); // Back-calculate room total if needed, or use stored total_paid which usually includes tax
    // Actually, total_paid in DB includes everything. 
    // Let's rely on tax_total and tax_details from booking.

    // Parse taxes
    let taxBreakdown = [];
    let totalTax = 0;
    try {
        if (booking.taxes_applied) {
            taxBreakdown = JSON.parse(booking.taxes_applied);
            totalTax = Number(booking.tax_total) || 0;
        }
    } catch (e) {
        // Fallback for old bookings
        totalTax = Number(booking.total_paid) * 0.1; // Estimate
    }

    const total = Number(booking.total_paid);
    const subtotal = total - totalTax; // Approximate subtotal

    return (
        <div className="flex-1 p-8 pt-6 print:p-0">
            <div className="max-w-3xl mx-auto space-y-6 print:max-w-full print:space-y-4">
                {/* Print Buttons - Hide when printing */}
                <div className="flex justify-between items-center print:hidden">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight gradient-text">Receipt</h2>
                        <p className="text-muted-foreground mt-1">Booking confirmation and payment details</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.location.reload()} className="mr-2">
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Receipt
                        </Button>
                    </div>
                </div>

                {/* Receipt Content */}
                <Card className="glass-card print:shadow-none print:border-none">
                    <CardContent className="p-8 space-y-6 print:p-4">
                        {/* Header */}
                        <div className="text-center border-b pb-6 print:pb-4">
                            <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">{booking.property_name}</h1>
                            <div className="text-muted-foreground space-y-1">
                                <p>{booking.address || 'Address not listed'}</p>
                                {booking.caretaker_phone && (
                                    <p className="flex items-center justify-center gap-2">
                                        <span className="font-medium">Tel:</span> {booking.caretaker_phone}
                                    </p>
                                )}
                            </div>
                            <div className="mt-4 inline-block px-4 py-1 border rounded-full text-sm font-semibold uppercase tracking-wider">
                                Booking Receipt
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm print:text-xs">
                            <div>
                                <p className="text-muted-foreground">Receipt #</p>
                                <p className="font-mono font-semibold">RCP-{id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground">Date Issued</p>
                                <p className="font-semibold">
                                    {new Date(booking.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Guest & Room Info */}
                        <div className="grid md:grid-cols-2 gap-6 border-b pb-6 print:gap-4 print:pb-4">
                            <div className="bg-secondary/10 p-4 rounded-lg print:border print:bg-transparent">
                                <h3 className="font-semibold mb-2 text-primary">Guest Details</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="font-bold text-lg">{booking.guest_name}</p>
                                    {booking.guest_email && (
                                        <p className="text-muted-foreground">{booking.guest_email}</p>
                                    )}
                                    <p className="text-muted-foreground">{booking.guests || 1} Guest(s)</p>
                                </div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-lg print:border print:bg-transparent">
                                <h3 className="font-semibold mb-2 text-primary">Room Details</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg">{booking.room_name || `Room ${booking.room_id?.slice(0, 8) || 'Unknown'}`}</p>
                                            <p className="text-sm text-muted-foreground">{booking.room_type}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <p className="text-muted-foreground">
                                            Check-in:<br />
                                            <span className="font-semibold text-foreground">{checkIn.toLocaleDateString()}</span>
                                        </p>
                                        <p className="text-muted-foreground">
                                            Check-out:<br />
                                            <span className="font-semibold text-foreground">{checkOut.toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                    <p className="text-xs mt-1 text-muted-foreground">
                                        Duration: {nights} Night{nights > 1 ? 's' : ''}
                                    </p>

                                    {/* Amenities in Room Details */}
                                    {booking.room_amenities && (
                                        <div className="pt-2 mt-2 border-t border-dashed">
                                            <p className="text-xs font-semibold mb-1 text-muted-foreground">Amenities:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    try {
                                                        const amns = typeof booking.room_amenities === 'string'
                                                            ? JSON.parse(booking.room_amenities)
                                                            : booking.room_amenities;
                                                        return Array.isArray(amns) ? amns.map((a: string) => (
                                                            <span key={a} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                                                {a}
                                                            </span>
                                                        )) : null;
                                                    } catch { return null; }
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Charges Table */}
                        <div>
                            <h3 className="font-semibold mb-4">Payment Breakdown</h3>
                            <div className="space-y-4">
                                {/* Base Charges */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm py-2 border-b border-dashed">
                                        <span>Room Charges ({nights} nights)</span>
                                        <span className="font-medium">${(subtotal - extrasTotal).toFixed(2)}</span>
                                    </div>

                                    {extras.length > 0 && (
                                        <>
                                            {extras.map((extra) => (
                                                <div key={extra.id} className="flex justify-between text-sm py-1 text-muted-foreground">
                                                    <span>{extra.item_name} (×{extra.quantity})</span>
                                                    <span>${(extra.price * extra.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm py-2 border-b border-dashed font-medium text-foreground">
                                                <span>Extras Total</span>
                                                <span>${extrasTotal.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Taxes */}
                                <div className="bg-secondary/5 p-3 rounded space-y-2 print:bg-transparent print:p-0">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span>Subtotal (Excl. Tax)</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>

                                    {taxBreakdown.length > 0 ? (
                                        taxBreakdown.map((t: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm text-muted-foreground">
                                                <span>{t.name} ({t.type === 'percentage' ? `${t.value}%` : 'fixed'}) on {t.applies_to}</span>
                                                <span>+${Number(t.amount).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : totalTax > 0 ? (
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Tax</span>
                                            <span>+${totalTax.toFixed(2)}</span>
                                        </div>
                                    ) : null}

                                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                                        <span>Total Tax</span>
                                        <span>${totalTax.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Grand Total */}
                                <div className="flex justify-between items-center bg-primary/10 p-4 rounded-lg border border-primary/20 print:bg-transparent print:border-black print:border-2">
                                    <span className="text-lg font-bold">TOTAL PAID</span>
                                    <span className="text-2xl font-bold text-primary print:text-black">
                                        ${total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-sm text-muted-foreground pt-6 border-t print:pt-4">
                            <p className="font-medium text-foreground">Thank you for your stay!</p>
                            <p className="text-xs mt-1">Paid via {booking.payment_method || 'Credit Card'}</p>
                        </div>
                    </CardContent>
                </Card>

                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .glass-card, .glass-card * {
                            visibility: visible;
                        }
                        .glass-card {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            box-shadow: none !important;
                            border: none !important;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
