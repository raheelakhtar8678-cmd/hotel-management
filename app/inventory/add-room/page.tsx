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
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>(['', '', '', '', '']);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const AMENITIES_LIST = [
        { id: 'tv', label: 'TV', icon: '📺' },
        { id: 'wifi', label: 'WiFi', icon: '📶' },
        { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
        { id: 'mini_fridge', label: 'Mini Fridge', icon: '🧊' },
        { id: 'towels', label: 'Towels', icon: '🛁' },
        { id: 'safe', label: 'Safe', icon: '🔐' },
        { id: 'balcony', label: 'Balcony', icon: '🏞️' },
        { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
        { id: 'coffee_maker', label: 'Coffee Maker', icon: '☕' },
        { id: 'hairdryer', label: 'Hair Dryer', icon: '💨' },
    ];

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties?fields=light');
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
        const name = formData.get('name') as string;
        const price = formData.get('price') as string;

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    type: roomType,
                    status: status,
                    name: name,
                    current_price: parseFloat(price) || 100,
                    amenities: selectedAmenities,
                    images: images.filter(url => url.trim() !== '')
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
                                <Label htmlFor="name">Room Name / Number *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., 101, 204, Penthouse"
                                    required
                                    className="bg-input border-primary/20"
                                />
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

                            <div className="space-y-2">
                                <Label htmlFor="price">Price per Night ($) *</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 150.00"
                                    required
                                    className="bg-input border-primary/20"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Set the nightly rate for this room. Deluxe/Suite rooms should have higher prices.
                                </p>
                            </div>

                            <div className="bg-secondary/30 rounded-lg p-4 text-sm">
                                <p className="font-medium mb-2">💡 Suggested Pricing:</p>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>Standard: Base property price</li>
                                    <li>Deluxe: +20-30% above base</li>
                                    <li>Suite: +50-100% above base</li>
                                    <li>Executive: +100%+ above base</li>
                                </ul>
                            </div>

                            {/* Amenities Selection */}
                            <div className="space-y-2">
                                <Label>Room Amenities</Label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Select amenities included with this room
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {AMENITIES_LIST.map((amenity) => (
                                        <button
                                            key={amenity.id}
                                            type="button"
                                            onClick={() => {
                                                if (selectedAmenities.includes(amenity.id)) {
                                                    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity.id));
                                                } else {
                                                    setSelectedAmenities([...selectedAmenities, amenity.id]);
                                                }
                                            }}
                                            className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${selectedAmenities.includes(amenity.id)
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-secondary/30 border-transparent hover:border-primary/30'
                                                }`}
                                        >
                                            <span>{amenity.icon}</span>
                                            <span>{amenity.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Room Images Gallery (5 slots) */}
                            <div className="space-y-3">
                                <Label>Room Images (up to 5)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Add up to 5 images to showcase your room
                                </p>

                                {/* Main Preview */}
                                <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-secondary/20 aspect-video">
                                    {images[activeImageIndex] ? (
                                        <img
                                            src={images[activeImageIndex]}
                                            alt={`Room image ${activeImageIndex + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '';
                                                e.currentTarget.alt = 'Failed to load';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <div className="text-center">
                                                <span className="text-4xl">📷</span>
                                                <p className="text-sm mt-2">No image added yet</p>
                                            </div>
                                        </div>
                                    )}
                                    {images[activeImageIndex] && (
                                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                            Image {activeImageIndex + 1} of {images.filter(i => i).length}
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail Strip */}
                                <div className="flex gap-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${activeImageIndex === idx
                                                ? 'border-primary ring-2 ring-primary/30'
                                                : 'border-transparent hover:border-primary/50'
                                                } ${img ? '' : 'bg-secondary/30'}`}
                                        >
                                            {img ? (
                                                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                                    {idx + 1}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* URL Input for selected image */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={`Paste image URL for slot ${activeImageIndex + 1}...`}
                                        value={images[activeImageIndex]}
                                        onChange={(e) => {
                                            const newImages = [...images];
                                            newImages[activeImageIndex] = e.target.value;
                                            setImages(newImages);
                                        }}
                                        className="bg-input border-primary/20"
                                    />
                                    {images[activeImageIndex] && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                const newImages = [...images];
                                                newImages[activeImageIndex] = '';
                                                setImages(newImages);
                                            }}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Click a slot above, then paste an image URL from Unsplash, Google Images, or your hosting
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
