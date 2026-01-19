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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPropertyPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<string[]>(['', '', '', '', '']);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        property_type: 'hotel',
        city: '',
        country: 'USA',
        address: '',
        base_price: '',
        bedrooms: '',
        bathrooms: '',
        max_guests: '',
        floors: '',
        caretaker_name: '',
        caretaker_email: '',
        caretaker_phone: ''
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Construct structure details
            const structureDetails: any = {};
            if (formData.property_type === 'hotel') {
                structureDetails.floors = Number(formData.floors) || 1;
            } else {
                structureDetails.bedrooms = Number(formData.bedrooms) || 1;
                structureDetails.bathrooms = Number(formData.bathrooms) || 1;
            }

            const payload = {
                name: formData.name,
                property_type: formData.property_type,
                city: formData.city,
                country: formData.country,
                address: formData.address,
                base_price: Number(formData.base_price),
                bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
                max_guests: formData.max_guests ? Number(formData.max_guests) : null,
                caretaker_name: formData.caretaker_name,
                caretaker_email: formData.caretaker_email,
                caretaker_phone: formData.caretaker_phone,
                structure_details: structureDetails,
                images: images.filter(url => url.trim() !== '')
            };

            const response = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/properties');
            } else {
                alert(`Failed to create property: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/properties">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Properties
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                        Add New Property
                    </h2>
                    <p className="text-muted-foreground">
                        Create a new property to manage and optimize pricing
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Property name and location</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Property Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Grand Hotel Downtown"
                                    required
                                    className="bg-input border-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="property_type">Property Type *</Label>
                                    <Select
                                        value={formData.property_type}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
                                    >
                                        <SelectTrigger className="bg-input border-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hotel">Hotel</SelectItem>
                                            <SelectItem value="apartment">Apartment</SelectItem>
                                            <SelectItem value="villa">Villa</SelectItem>
                                            <SelectItem value="house">House</SelectItem>
                                            <SelectItem value="resort">Resort</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="e.g., Miami"
                                        required
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                        placeholder="e.g., USA"
                                        className="bg-input border-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Full Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="123 Main St"
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property Structure */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Structure Details</CardTitle>
                            <CardDescription>
                                {formData.property_type === 'hotel' ? 'Floors and capacity' : 'Bedrooms, bathrooms, and capacity'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.property_type === 'hotel' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="floors">Number of Floors</Label>
                                        <Input
                                            id="floors"
                                            type="number"
                                            min="1"
                                            value={formData.floors}
                                            onChange={(e) => setFormData(prev => ({ ...prev, floors: e.target.value }))}
                                            placeholder="5"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_guests">Max Capacity (Guests)</Label>
                                        <Input
                                            id="max_guests"
                                            type="number"
                                            min="1"
                                            value={formData.max_guests}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                                            placeholder="100"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bedrooms">Bedrooms</Label>
                                        <Input
                                            id="bedrooms"
                                            type="number"
                                            min="0"
                                            value={formData.bedrooms}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                                            placeholder="2"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bathrooms">Bathrooms</Label>
                                        <Input
                                            id="bathrooms"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={formData.bathrooms}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                                            placeholder="1.5"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_guests">Max Guests</Label>
                                        <Input
                                            id="max_guests"
                                            type="number"
                                            min="1"
                                            value={formData.max_guests}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                                            placeholder="4"
                                            className="bg-input border-primary/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Caretaker / Staff Section */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Caretaker / Staff (Optional)</CardTitle>
                            <CardDescription>Contact information for property manager</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="caretaker_name">Name</Label>
                                <Input
                                    id="caretaker_name"
                                    value={formData.caretaker_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, caretaker_name: e.target.value }))}
                                    placeholder="John Doe"
                                    className="bg-input border-primary/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="caretaker_phone">Phone</Label>
                                    <Input
                                        id="caretaker_phone"
                                        value={formData.caretaker_phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, caretaker_phone: e.target.value }))}
                                        placeholder="+1 555-0123"
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="caretaker_email">Email</Label>
                                    <Input
                                        id="caretaker_email"
                                        type="email"
                                        value={formData.caretaker_email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, caretaker_email: e.target.value }))}
                                        placeholder="john@example.com"
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Base Pricing</CardTitle>
                            <CardDescription>Default nightly rate before rules</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="base_price">Base Price per Night (USD) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        min="1"
                                        value={formData.base_price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                                        required
                                        className="bg-input border-primary/20 pl-7"
                                        placeholder="100"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This is your default price. Pricing rules will adjust this automatically.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property Images Gallery */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Property Images</CardTitle>
                            <CardDescription>Add up to 5 photos to showcase your property</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Main Preview */}
                            <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-secondary/20 aspect-video">
                                {images[activeImageIndex] ? (
                                    <img
                                        src={images[activeImageIndex]}
                                        alt={`Property image ${activeImageIndex + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = '';
                                            e.currentTarget.alt = 'Failed to load';
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <div className="text-center">
                                            <span className="text-5xl">🏠</span>
                                            <p className="text-sm mt-2">Add images to attract guests</p>
                                        </div>
                                    </div>
                                )}
                                {images[activeImageIndex] && (
                                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                        {activeImageIndex + 1} / {images.filter(i => i).length}
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

                            {/* URL Input */}
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
                                💡 Tip: Use high-quality images from Unsplash or your own photography
                            </p>
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <Link href="/properties" className="flex-1">
                            <Button variant="outline" type="button" className="w-full">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-primary hover:opacity-90"
                            disabled={saving}
                        >
                            {saving ? (
                                'Creating...'
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Property
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
