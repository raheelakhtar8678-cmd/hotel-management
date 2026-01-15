"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddRoomPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties');
            const data = await response.json();
            setProperties(data.properties || []);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const propertyId = formData.get('property_id') as string;
        const roomType = formData.get('room_type') as string;
        const status = formData.get('status') as string;

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    type: roomType,
                    status: status,
                }),
            });

            if (response.ok) {
                router.push('/inventory');
            } else {
                alert('Failed to add room');
            }
        } catch (error) {
            console.error('Error adding room:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/inventory">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Inventory
                    </Button>
                </Link>
            </div>

            <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                    Add New Room
                </h2>
                <p className="text-muted-foreground mb-6">
                    Create a new room listing for your property
                </p>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Room Details</CardTitle>
                        <CardDescription>
                            Select the property and configure room settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="property_id">Property *</Label>
                                <Select name="property_id" required>
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
                                <Label htmlFor="room_type">Room Type *</Label>
                                <Select name="room_type" defaultValue="Standard">
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                                        <SelectItem value="Suite">Suite</SelectItem>
                                        <SelectItem value="Premium">Premium</SelectItem>
                                        <SelectItem value="Executive">Executive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select name="status" defaultValue="available">
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="occupied">Occupied</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-secondary/30 rounded-lg p-4 text-sm">
                                <p className="font-medium mb-2">💡 Note:</p>
                                <p className="text-muted-foreground">
                                    The room will inherit the base price from the selected property.
                                    You can adjust individual room prices later in the inventory view.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-primary hover:opacity-90"
                                disabled={loading}
                            >
                                {loading ? (
                                    'Adding Room...'
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Room
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
