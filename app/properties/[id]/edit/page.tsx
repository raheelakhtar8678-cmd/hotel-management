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
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    useEffect(() => {
        fetchProperty();
    }, [propertyId]);

    const fetchProperty = async () => {
        try {
            const response = await fetch(`/api/properties?id=${propertyId}`);
            const data = await response.json();

            if (data.success && data.property) {
                const property = data.property;
                setFormData({
                    name: property.name || '',
                    property_type: property.property_type || 'hotel',
                    city: property.city || '',
                    country: property.country || 'USA',
                    address: property.address || '',
                    base_price: property.base_price?.toString() || '',
                    bedrooms: property.bedrooms?.toString() || '',
                    bathrooms: property.bathrooms?.toString() || '',
                    max_guests: property.max_guests?.toString() || '',
                    floors: property.structure_details?.floors?.toString() || '',
                    caretaker_name: property.caretaker_name || '',
                    caretaker_email: property.caretaker_email || '',
                    caretaker_phone: property.caretaker_phone || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch property:', error);
            alert('Failed to load property');
        } finally {
            setLoading(false);
        }
    };

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

            const response = await fetch('/api/properties', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: propertyId,
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
                    structure_details: structureDetails
                }),
            });

            if (response.ok) {
                router.push(`/properties/${propertyId}`);
            } else {
                alert('Failed to update property');
            }
        } catch (error) {
            console.error('Error updating property:', error);
            alert('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 pt-6">
                <p className="text-center text-muted-foreground">Loading property...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/properties/${propertyId}`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Property
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold tracking-tight gradient-text mb-2">
                        Edit Property
                    </h2>
                    <p className="text-muted-foreground">
                        Update property details and pricing
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

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <Link href={`/properties/${propertyId}`} className="flex-1">
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
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
