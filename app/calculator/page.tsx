'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calculator as CalcIcon, Plus, X, FileText, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CalculatorPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guests, setGuests] = useState(1);
    const [extras, setExtras] = useState<any[]>([]);
    const [newExtra, setNewExtra] = useState({ name: '', price: '', quantity: 1, chargeType: 'one-time' });
    const [pricingRules, setPricingRules] = useState<any[]>([]);
    const [pricingMode, setPricingMode] = useState('auto');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [appliedRules, setAppliedRules] = useState<any[]>([]);
    const [taxes, setTaxes] = useState<any[]>([]);
    const [selectedTaxIds, setSelectedTaxIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            fetchRooms(selectedProperty);
            fetchPricingRules(selectedProperty);
            fetchTaxes(selectedProperty);
        } else {
            setPricingRules([]);
            setTaxes([]);
            setSelectedTaxIds(new Set());
        }
    }, [selectedProperty]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/properties');
            const data = await res.json();
            setProperties(data.properties || []);
            if (data.properties?.length > 0 && !selectedProperty) {
                // Optionally select first property? No, let user select.
            }
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

    const fetchPricingRules = async (propertyId: string) => {
        try {
            const res = await fetch(`/api/pricing-rules?property_id=${propertyId}`);
            const data = await res.json();
            if (data.success) {
                setPricingRules(data.rules || []);
            }
        } catch (error) {
            console.error('Error fetching pricing rules:', error);
        }
    };

    const fetchTaxes = async (propertyId: string) => {
        try {
            const res = await fetch(`/api/taxes?property_id=${propertyId}`);
            const data = await res.json();
            const fetchedTaxes = data.taxes || [];
            setTaxes(fetchedTaxes);
            // Default select all active taxes
            setSelectedTaxIds(new Set(fetchedTaxes.map((t: any) => t.id)));
        } catch (error) {
            console.error('Error fetching taxes:', error);
        }
    };

    const toggleTax = (taxId: string) => {
        const newSelected = new Set(selectedTaxIds);
        if (newSelected.has(taxId)) {
            newSelected.delete(taxId);
        } else {
            newSelected.add(taxId);
        }
        setSelectedTaxIds(newSelected);
    };

    const addExtra = () => {
        if (!newExtra.name || !newExtra.price) return;
        setExtras([...extras, { ...newExtra, id: Date.now().toString() }]);
        setNewExtra({ name: '', price: '', quantity: 1, chargeType: 'one-time' });
    };

    const removeExtra = (id: string) => {
        setExtras(extras.filter(e => e.id !== id));
    };

    // Calculations
    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const nights = calculateNights();

    // Base Room Total
    let baseRoomTotal = 0;
    if (selectedRoom && nights > 0) {
        baseRoomTotal = Number(selectedRoom.current_price) * nights;
        if (isNaN(baseRoomTotal)) baseRoomTotal = 0;
    }

    // Active Adjustments
    const activeAdjustments: any[] = [];
    let adjustmentsTotal = 0;

    const rulesToApply = pricingMode === 'manual'
        ? pricingRules.filter(r => r.id === selectedRuleId)
        : pricingRules.filter(r => r.is_active); // Simple auto logic for now, usually would check dates

    // In a real scenario, "auto" might select rules based on date overlap. 
    // For this calculator version, let's treat "auto" as "all active rules" or maybe "none" if we don't have date logic?
    // Let's stick to: Manual selects one, Auto selects active ones (simplification).

    rulesToApply.forEach(rule => {
        let amount = 0;
        if (rule.type === 'fixed') {
            amount = Number(rule.value);
        } else if (rule.type === 'percentage') {
            amount = baseRoomTotal * (Number(rule.value) / 100);
        }

        if (amount !== 0) {
            activeAdjustments.push({
                name: rule.name,
                amount: amount,
                percentage: rule.type === 'percentage' ? rule.value : null
            });
            adjustmentsTotal += amount;
        }
    });

    const extrasTotal = (extras || []).reduce((sum, e) => {
        const baseAmount = Number(e.price) * Number(e.quantity);
        return sum + (e.chargeType === 'per-night' ? baseAmount * nights : baseAmount);
    }, 0);

    // Safety check for NaN
    const safeBase = isNaN(baseRoomTotal) ? 0 : baseRoomTotal;
    const safeAdj = isNaN(adjustmentsTotal) ? 0 : adjustmentsTotal;
    const safeExtras = isNaN(extrasTotal) ? 0 : extrasTotal;

    const subtotal = safeBase + safeAdj + safeExtras;

    // Calculate taxes dynamically based on selection
    let taxBreakdown: any[] = [];
    let totalTax = 0;

    (taxes || []).forEach(tax => {
        // Skip if not selected
        if (!selectedTaxIds.has(tax.id)) return;

        let taxAmount = 0;
        let baseForTax = 0;

        // Determine what to apply tax to
        if (tax.applies_to === 'room') {
            baseForTax = safeBase + safeAdj;
        } else if (tax.applies_to === 'extras') {
            baseForTax = safeExtras;
        } else if (tax.applies_to === 'total') {
            baseForTax = subtotal;
        }

        // Calculate tax amount
        if (tax.type === 'percentage') {
            taxAmount = baseForTax * (Number(tax.value) / 100);
        } else if (tax.type === 'fixed') {
            taxAmount = Number(tax.value);
        }

        if (taxAmount > 0 && !isNaN(taxAmount)) {
            totalTax += taxAmount;
            taxBreakdown.push({
                name: tax.name,
                type: tax.type,
                value: tax.value,
                amount: taxAmount,
                applies_to: tax.applies_to
            });
        }
    });

    const tax = totalTax;
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
                    guests: guests,
                    total_price: total,
                    status: 'confirmed',
                    taxes_applied: JSON.stringify(taxBreakdown),
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
                                <div>
                                    <Label htmlFor="guests">Number of Guests</Label>
                                    <Input
                                        id="guests"
                                        type="number"
                                        min="1"
                                        value={guests}
                                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
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
                                        {rooms.filter(r => r.status === 'available').map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name || r.type} ({r.type}) - ${r.current_price}/night
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 border-t">
                                    <Label className="mb-2 block">Pricing Strategy</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select value={pricingMode} onValueChange={setPricingMode}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="auto">Automatic (Active Rules)</SelectItem>
                                                <SelectItem value="manual">Manual Selection</SelectItem>
                                                <SelectItem value="none">No Rules (Base Price)</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {pricingMode === 'manual' && (
                                            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose rule..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {pricingRules.map(r => (
                                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
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
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="checkOut">Check-out *</Label>
                                        <Input
                                            id="checkOut"
                                            type="date"
                                            value={checkOut}
                                            min={checkIn || new Date().toISOString().split('T')[0]}
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

                        {/* Tax Configuration */}
                        {taxes.length > 0 && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Applicable Taxes</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[120px] rounded-md border p-4 bg-secondary/10">
                                        <div className="space-y-4">
                                            {taxes.map((tax) => (
                                                <div key={tax.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`tax-${tax.id}`}
                                                        checked={selectedTaxIds.has(tax.id)}
                                                        onCheckedChange={() => toggleTax(tax.id)}
                                                    />
                                                    <label
                                                        htmlFor={`tax-${tax.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center justify-between w-full"
                                                    >
                                                        <span>{tax.name}</span>
                                                        <span className="text-muted-foreground text-xs">
                                                            {tax.type === 'percentage' ? `${tax.value}%` : `$${tax.value}`} on {tax.applies_to}
                                                        </span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}

                        {/* Extras */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Add Extras</CardTitle>
                                <CardDescription>Optional services and items</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {extras.map(extra => (
                                        <div key={extra.id} className="flex items-center justify-between p-2 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{extra.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    ${extra.price} × {extra.quantity}{extra.chargeType === 'per-night' ? ` × ${nights} nights` : ' (one-time)'} = ${(
                                                        extra.chargeType === 'per-night'
                                                            ? extra.price * extra.quantity * nights
                                                            : extra.price * extra.quantity
                                                    ).toFixed(2)}
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
                                    <Select
                                        value={newExtra.chargeType}
                                        onValueChange={(v) => setNewExtra({ ...newExtra, chargeType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="one-time">One-time</SelectItem>
                                            <SelectItem value="per-night">Per Night</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        {/* Room & Guest Info Header */}
                                        <div className="border-b pb-4 mb-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-lg">{selectedRoom.name || `Room ${String(selectedRoom.id || '').slice(0, 8) || 'Unknown'}`}</p>
                                                    <p className="text-sm text-muted-foreground">{selectedRoom.type}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-semibold text-primary">${Number(selectedRoom.current_price).toFixed(2)}/night</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium text-foreground">{guests}</span> Guest{guests > 1 ? 's' : ''}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium text-foreground">{nights}</span> Night{nights > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {/* Amenities */}
                                            {selectedRoom.amenities && (() => {
                                                try {
                                                    const amns = typeof selectedRoom.amenities === 'string'
                                                        ? JSON.parse(selectedRoom.amenities)
                                                        : selectedRoom.amenities;
                                                    if (Array.isArray(amns) && amns.length > 0) {
                                                        return (
                                                            <div className="flex flex-wrap gap-1 pt-2">
                                                                {amns.slice(0, 5).map((a: string) => (
                                                                    <span key={a} className="text-[10px] bg-secondary/30 px-1.5 py-0.5 rounded">
                                                                        {a}
                                                                    </span>
                                                                ))}
                                                                {amns.length > 5 && (
                                                                    <span className="text-[10px] text-muted-foreground">+{amns.length - 5} more</span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                } catch { }
                                                return null;
                                            })()}
                                        </div>

                                        {/* Price Breakdown */}
                                        <div className="space-y-3 pb-4 border-b">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Room ({nights} nights)</span>
                                                <span className="font-medium">${baseRoomTotal.toFixed(2)}</span>
                                            </div>

                                            {/* Adjustments */}
                                            {activeAdjustments.map((adj, idx) => (
                                                <div key={idx} className="flex justify-between text-sm text-emerald-600">
                                                    <span>
                                                        {adj.name}
                                                        {adj.percentage && <span className="text-xs ml-1 opacity-70">({adj.percentage}%)</span>}
                                                    </span>
                                                    <span>{adj.amount > 0 ? '+' : ''}{adj.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
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

                                            {/* Tax Breakdown */}
                                            {taxBreakdown.length > 0 && (
                                                <div className="pt-2 border-t space-y-2">
                                                    {taxBreakdown.map((taxItem, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm text-blue-600">
                                                            <span>
                                                                {taxItem.name}
                                                                {taxItem.type === 'percentage' && (
                                                                    <span className="text-xs ml-1 opacity-70">
                                                                        ({taxItem.value}%)
                                                                    </span>
                                                                )}
                                                                {taxItem.type === 'fixed' && (
                                                                    <span className="text-xs ml-1 opacity-70">
                                                                        (fixed)
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span>+${taxItem.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                                                        <span className="text-muted-foreground">Total Tax</span>
                                                        <span>${tax.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}
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
