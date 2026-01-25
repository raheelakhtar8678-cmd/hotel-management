'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Calendar, Users, Mail, Phone, User, Loader2,
    Calculator, CheckCircle2, AlertCircle
} from "lucide-react";

interface Extra {
    id: string;
    name: string;
    price: number;
    description?: string;
    category?: string;
}

interface BookingCalculatorModalProps {
    open: boolean;
    onClose: () => void;
    room: {
        id: string;
        name: string;
        basePrice: number;
        maxGuests: number;
        property: {
            name: string;
            currency: string;
        };
    };
    extras: Extra[];
    onBookingComplete: (booking: any) => void;
}

export function BookingCalculatorModal({
    open,
    onClose,
    room,
    extras,
    onBookingComplete
}: BookingCalculatorModalProps) {
    // Form state
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [selectedExtras, setSelectedExtras] = useState<{ id: string; quantity: number }[]>([]);
    const [notes, setNotes] = useState('');

    // Calculation state
    const [calculating, setCalculating] = useState(false);
    const [calculation, setCalculation] = useState<any>(null);
    const [error, setError] = useState('');

    // Booking state
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Calculate price when dates or extras change
    useEffect(() => {
        if (checkIn && checkOut && room.id) {
            calculatePrice();
        }
    }, [checkIn, checkOut, selectedExtras]);

    const calculatePrice = async () => {
        setCalculating(true);
        setError('');

        try {
            const res = await fetch('/api/public/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: room.id,
                    check_in: checkIn,
                    check_out: checkOut,
                    guests,
                    extras: selectedExtras
                })
            });

            const data = await res.json();
            if (data.success) {
                setCalculation(data.calculation);
            } else {
                setError(data.error || 'Failed to calculate price');
            }
        } catch (err) {
            setError('Failed to calculate price');
        } finally {
            setCalculating(false);
        }
    };

    const handleExtraToggle = (extraId: string, checked: boolean) => {
        if (checked) {
            setSelectedExtras([...selectedExtras, { id: extraId, quantity: 1 }]);
        } else {
            setSelectedExtras(selectedExtras.filter(e => e.id !== extraId));
        }
    };

    const handleBook = async () => {
        if (!checkIn || !checkOut || !guestName || !guestEmail || !calculation) {
            setBookingError('Please fill in all required fields');
            return;
        }

        setBooking(true);
        setBookingError('');

        try {
            const res = await fetch('/api/public/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: room.id,
                    check_in: checkIn,
                    check_out: checkOut,
                    guests,
                    guest_name: guestName,
                    guest_email: guestEmail,
                    guest_phone: guestPhone,
                    extras: selectedExtras,
                    notes,
                    total_amount: calculation.grandTotal,
                    calculated_breakdown: calculation
                })
            });

            const data = await res.json();
            if (data.success) {
                onBookingComplete(data.booking);
            } else {
                setBookingError(data.error || 'Failed to create booking');
            }
        } catch (err) {
            setBookingError('Failed to create booking');
        } finally {
            setBooking(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Book {room.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Check-in *
                            </Label>
                            <Input
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                min={today}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Check-out *
                            </Label>
                            <Input
                                type="date"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                min={checkIn || today}
                                required
                            />
                        </div>
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Number of Guests
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            max={room.maxGuests || 10}
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                        />
                        <p className="text-xs text-muted-foreground">Max {room.maxGuests || 10} guests</p>
                    </div>

                    {/* Guest Details */}
                    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                        <h4 className="font-medium">Guest Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> Full Name *
                                </Label>
                                <Input
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="John Smith"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Email *
                                </Label>
                                <Input
                                    type="email"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Phone (optional)
                            </Label>
                            <Input
                                type="tel"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                    </div>

                    {/* Extras */}
                    {extras.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium">Add Extras</h4>
                            <div className="grid gap-2">
                                {extras.map((extra) => (
                                    <label
                                        key={extra.id}
                                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedExtras.some(e => e.id === extra.id)}
                                                onCheckedChange={(checked) => handleExtraToggle(extra.id, checked as boolean)}
                                            />
                                            <div>
                                                <p className="font-medium text-sm">{extra.name}</p>
                                                {extra.description && (
                                                    <p className="text-xs text-muted-foreground">{extra.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="secondary">${extra.price}</Badge>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Price Calculation */}
                    {calculating ? (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : calculation ? (
                        <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                            <h4 className="font-medium mb-3">Price Breakdown</h4>
                            <div className="flex justify-between text-sm">
                                <span>${calculation.basePrice} × {calculation.nights} nights</span>
                                <span>${(calculation.basePrice * calculation.nights).toFixed(2)}</span>
                            </div>
                            {calculation.weekendSurcharge > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Weekend surcharge ({calculation.weekendNights} nights)</span>
                                    <span>+${calculation.weekendSurcharge.toFixed(2)}</span>
                                </div>
                            )}
                            {calculation.extras?.map((extra: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm text-muted-foreground">
                                    <span>{extra.name} × {extra.quantity}</span>
                                    <span>+${(extra.price * extra.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            {calculation.taxes?.map((tax: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm text-muted-foreground">
                                    <span>{tax.name}</span>
                                    <span>+${tax.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                <span>Total</span>
                                <span className="text-primary">${calculation.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    ) : checkIn && checkOut && error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Booking Error */}
                    {bookingError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {bookingError}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBook}
                            disabled={!calculation || booking || !guestName || !guestEmail}
                            className="flex-1 bg-gradient-to-r from-primary to-cyan-500"
                        >
                            {booking ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            {booking ? 'Booking...' : 'Confirm Booking'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
