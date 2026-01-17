'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator as CalcIcon, Plus, X, FileText } from "lucide-react";

export default function CalculatorPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [extras, setExtras] = useState<any[]>([]);
    const [newExtra, setNewExtra] = useState({ name: '', price: '', quantity: 1 });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            fetchRooms(selectedProperty);
        }
    }, [selectedProperty]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/properties');
            const data = await res.json();
            setProperties(data.properties || []);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const fetchRooms = async (propertyId: string) => {
        try {
            const res = await fetch(`/api/rooms?property_id=${propertyId}`);
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const addExtra = () => {
        if (newExtra.name && newExtra.price) {
            setExtras([...extras, { ...newExtra, price: parseFloat(newExtra.price), id: Date.now() }]);
            setNewExtra({ name: '', price: '', quantity: 1 });
        }
    };

    const removeExtra = (id: number) => {
        setExtras(extras.filter(e => e.id !== id));
    };

    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 0;
    };

    const nights = calculateNights();
    const roomTotal = selectedRoom ? (selectedRoom.current_price || 0) * nights : 0;
    const extrasTotal = extras.reduce((sum, e) => sum + (e.price * e.quantity * nights), 0);
    const subtotal = roomTotal + extrasTotal;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const handleSaveQuote = async () => {
        if (!selectedRoom || !checkIn || !checkOut || !guestName) {
            alert('Please fill in all required fields');
            return;
        }

        // Create booking
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: selectedRoom.id,
                    guest_name: guestName,
                    guest_email: guestEmail,
                    check_in: checkIn,
                    check_out: checkOut,
                    total_price: total,
                    status: 'confirmed'
                })
            });

            const data = await response.json();
            if (data.success) {
                // Add extras to booking
                for (const extra of extras) {
                    await fetch('/api/room-extras', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            room_id: selectedRoom.id,
                            booking_id: data.booking.id,
                            item_name: extra.name,
                            price: extra.price,
                            quantity: extra.quantity * nights
                        })
                    });
                }

                alert(`Booking created! Receipt ID: ${data.booking.id}`);
                window.location.href = `/receipts/${data.booking.id}`;
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking');
        }
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text flex items-center gap-2">
                        <CalcIcon className="h-8 w-8" />
                        Booking Calculator
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Calculate total booking cost with room rates and extras
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Inputs */}
                    <div className="space-y-6">
                        {/* Guest Information */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Guest Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="guestName">Guest Name *</Label>
                                    <Input
                                        id="guestName"
                                        placeholder="John Doe"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="guestEmail">Email (Optional)</Label>
                                    <Input
                                        id="guestEmail"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Room Selection */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Room Selection</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="property">Property *</Label>
                                    <select
                                        id="property"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                        value={selectedProperty}
                                        onChange={(e) => {
                                            setSelectedProperty(e.target.value);
                                            setSelectedRoom(null);
                                        }}
                                    >
                                        <option value="">Select property...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="room">Room *</Label>
                                    <select
                                        id="room"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                        disabled={!selectedProperty}
                                        value={selectedRoom?.id || ''}
                                        onChange={(e) => {
                                            const room = rooms.find(r => r.id === e.target.value);
                                            setSelectedRoom(room || null);
                                        }}
                                    >
                                        <option value="">Select room...</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.type} - ${r.current_price}/night
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dates */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Stay Duration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="checkIn">Check-in *</Label>
                                        <Input
                                            id="checkIn"
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="checkOut">Check-out *</Label>
                                        <Input
                                            id="checkOut"
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {nights > 0 && (
                                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                                        <p className="text-sm font-semibold text-center">
                                            Total Nights: <span className="text-primary text-lg">{nights}</span>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Extras */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Add Extras</CardTitle>
                                <CardDescription>Optional services (charged per night)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {extras.map(extra => (
                                        <div key={extra.id} className="flex items-center justify-between p-2 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{extra.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    ${extra.price} × {extra.quantity} × {nights} nights = ${(extra.price * extra.quantity * nights).toFixed(2)}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeExtra(extra.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        placeholder="Item name"
                                        value={newExtra.name}
                                        onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Price"
                                        value={newExtra.price}
                                        onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                                    />
                                    <Button onClick={addExtra} variant="outline" className="w-full">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Summary */}
                    <div>
                        <Card className="glass-card sticky top-6">
                            <CardHeader>
                                <CardTitle>Booking Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedRoom && nights > 0 ? (
                                    <>
                                        <div className="space-y-3 pb-4 border-b">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Room ({nights} nights)</span>
                                                <span className="font-medium">${roomTotal.toFixed(2)}</span>
                                            </div>
                                            {extras.length > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Extras</span>
                                                    <span className="font-medium">${extrasTotal.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tax (10%)</span>
                                                <span className="font-medium">${tax.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-bold">TOTAL</span>
                                            <span className="text-2xl font-bold text-emerald-600">
                                                ${total.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="pt-4 space-y-2">
                                            <Button
                                                onClick={handleSaveQuote}
                                                className="w-full bg-gradient-primary"
                                                disabled={!guestName}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Create Booking & Generate Receipt
                                            </Button>
                                            <p className="text-xs text-muted-foreground text-center">
                                                This will create a confirmed booking
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CalcIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Select property, room, and dates to calculate</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
