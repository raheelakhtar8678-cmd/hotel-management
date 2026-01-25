"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewBookingPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        room_id: '',
        guest_name: '',
        guest_email: '',
        check_in: '',
        check_out: '',
        guests: '1',
        total_paid: '',
        status: 'confirmed',
        channel: 'direct',
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            fetchRooms(selectedProperty);
        }
    }, [selectedProperty]);

    // Auto-calculate total price when dates change
    useEffect(() => {
        if (formData.check_in && formData.check_out && formData.room_id) {
            calculateTotal();
        }
    }, [formData.check_in, formData.check_out, formData.room_id]);

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties?fields=light');
            const data = await response.json();
            setProperties(data.properties || []);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        }
    };

    const fetchRooms = async (propertyId: string) => {
        try {
            const response = await fetch(`/api/properties?id=${propertyId}`);
            const data = await response.json();
            // Assuming the API returns property with rooms
            setRooms(data.property?.rooms || []);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const calculateTotal = () => {
        if (!formData.check_in || !formData.check_out || !formData.room_id) return;

        const checkIn = new Date(formData.check_in);
        const checkOut = new Date(formData.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        if (nights > 0) {
            const selectedRoom = rooms.find(r => r.id === formData.room_id);
            const pricePerNight = selectedRoom?.current_price || 100;
            const total = nights * pricePerNight;
            setFormData(prev => ({ ...prev, total_paid: total.toString() }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: formData.room_id,
                    guest_name: formData.guest_name,
                    guest_email: formData.guest_email,
                    check_in: formData.check_in,
                    check_out: formData.check_out,
                    guests: Number(formData.guests),
                    total_paid: Number(formData.total_paid),
                    status: formData.status,
                    channel: formData.channel,
                }),
            });

            if (response.ok) {
                router.push('/calendar');
            } else {
                alert('Failed to create booking');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nights = formData.check_in && formData.check_out
        ? Math.max(0, Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/calendar">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Calendar
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                        New Booking
                    </h2>
                    <p className="text-muted-foreground">
                        Create a direct reservation
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Property & Room Selection */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Property & Room</CardTitle>
                            <CardDescription>Select the property and room</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="property">Property *</Label>
                                <Select
                                    value={selectedProperty}
                                    onValueChange={setSelectedProperty}
                                    required
                                >
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue placeholder="Select a property" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map((property) => (
                                            <SelectItem key={property.id} value={property.id}>
                                                {property.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="room_id">Room *</Label>
                                <Select
                                    value={formData.room_id}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, room_id: value }))}
                                    required
                                    disabled={!selectedProperty}
                                >
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue placeholder={selectedProperty ? "Select a room" : "Select property first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.type} - ${room.current_price}/night
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Guest Information */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Guest Information</CardTitle>
                            <CardDescription>Details about the guest</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="guest_name">Guest Name *</Label>
                                <Input
                                    id="guest_name"
                                    value={formData.guest_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                                    placeholder="John Doe"
                                    required
                                    className="bg-input border-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="guest_email">Email</Label>
                                    <Input
                                        id="guest_email"
                                        type="email"
                                        value={formData.guest_email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, guest_email: e.target.value }))}
                                        placeholder="john@example.com"
                                        className="bg-input border-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guests">Number of Guests *</Label>
                                    <Input
                                        id="guests"
                                        type="number"
                                        min="1"
                                        value={formData.guests}
                                        onChange={(e) => setFormData(prev => ({ ...prev, guests: e.target.value }))}
                                        required
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dates & Pricing */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Dates & Pricing</CardTitle>
                            <CardDescription>Check-in and check-out information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="check_in">Check-In Date *</Label>
                                    <Input
                                        id="check_in"
                                        type="date"
                                        value={formData.check_in}
                                        onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
                                        required
                                        className="bg-input border-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="check_out">Check-Out Date *</Label>
                                    <Input
                                        id="check_out"
                                        type="date"
                                        value={formData.check_out}
                                        onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
                                        required
                                        min={formData.check_in}
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>

                            {nights > 0 && (
                                <div className="bg-secondary/30 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{nights} Night{nights > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                        <span className="text-2xl font-bold text-emerald-500">
                                            ${formData.total_paid || '0'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Booking Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                    >
                                        <SelectTrigger className="bg-input border-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="channel">Booking Channel *</Label>
                                    <Select
                                        value={formData.channel}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value }))}
                                    >
                                        <SelectTrigger className="bg-input border-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="direct">Direct</SelectItem>
                                            <SelectItem value="airbnb">Airbnb</SelectItem>
                                            <SelectItem value="vrbo">Vrbo</SelectItem>
                                            <SelectItem value="booking_com">Booking.com</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <Link href="/calendar" className="flex-1">
                            <Button variant="outline" type="button" className="w-full">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-primary hover:opacity-90"
                            disabled={loading}
                        >
                            {loading ? 'Creating Booking...' : 'Create Booking'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
