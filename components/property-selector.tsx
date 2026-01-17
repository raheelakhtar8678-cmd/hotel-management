"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Property {
    id: string;
    name: string;
    property_type: string;
    city?: string;
    is_active: boolean;
}

interface PropertySelectorProps {
    currentPropertyId?: string;
    onPropertyChange?: (propertyId: string) => void;
}

import { useRouter } from "next/navigation";

export function PropertySelector({ currentPropertyId, onPropertyChange }: PropertySelectorProps) {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedId, setSelectedId] = useState<string>(currentPropertyId || "all");
    const [loading, setLoading] = useState(true);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    // Form state
    const [newPropertyType, setNewPropertyType] = useState("apartment");

    useEffect(() => {
        fetchProperties();
        const match = document.cookie.match(new RegExp('(^| )yieldvibe_property_id=([^;]+)'));
        if (match && !currentPropertyId) {
            setSelectedId(match[2]);
        }
    }, [currentPropertyId]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/properties');
            const data = await response.json();
            setProperties(data.properties || []);

            if (!currentPropertyId && data.properties?.length > 0) {
                const firstActive = data.properties.find((p: Property) => p.is_active);
                if (firstActive) {
                    setSelectedId(firstActive.id);
                    onPropertyChange?.(firstActive.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (value: string) => {
        setSelectedId(value);
        onPropertyChange?.(value);
        document.cookie = `yieldvibe_property_id=${value}; path=/; max-age=31536000`;
        router.refresh();
    };

    const handleAddProperty = async (formData: FormData) => {
        const name = formData.get('name') as string;
        const propertyType = newPropertyType;
        const city = formData.get('city') as string;
        const basePrice = formData.get('base_price') as string;

        // Caretaker Info
        const caretakerName = formData.get('caretaker_name') as string;
        const caretakerEmail = formData.get('caretaker_email') as string;
        const caretakerPhone = formData.get('caretaker_phone') as string;

        // Structure Info
        const structureDetails: any = {};
        if (propertyType === 'hotel') {
            structureDetails.floors = Number(formData.get('floors')) || 1;
        } else {
            structureDetails.bedrooms = Number(formData.get('bedrooms')) || 1;
            structureDetails.bathrooms = Number(formData.get('bathrooms')) || 1;
        }

        try {
            const response = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    property_type: propertyType,
                    city,
                    base_price: Number(basePrice) || 100,
                    caretaker_name: caretakerName,
                    caretaker_email: caretakerEmail,
                    caretaker_phone: caretakerPhone,
                    structure_details: structureDetails,
                    // Keep existing schema fields if API expects them directly too
                    bedrooms: structureDetails.bedrooms,
                    bathrooms: structureDetails.bathrooms
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAddDialogOpen(false);
                fetchProperties();
                handleChange(data.property.id);
            } else {
                alert('Failed to create property');
            }
        } catch (error) {
            console.error('Error creating property:', error);
            alert('Network error. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Building2 className="h-5 w-5" />
                <span className="text-sm">Loading properties...</span>
            </div>
        );
    }

    const selectedProperty = properties.find(p => p.id === selectedId);
    const activePropertiesCount = properties.filter(p => p.is_active).length;

    return (
        <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />

            <Select value={selectedId} onValueChange={handleChange}>
                <SelectTrigger className="w-[240px] bg-secondary/50 border-primary/20">
                    <SelectValue>
                        {selectedId === "all" ? (
                            <span className="flex items-center gap-2">
                                <span className="font-semibold">All Properties</span>
                                <span className="text-xs text-muted-foreground">({activePropertiesCount})</span>
                            </span>
                        ) : selectedProperty ? (
                            <span className="flex items-center gap-2">
                                <span className="font-semibold truncate">{selectedProperty.name}</span>
                                {selectedProperty.city && (
                                    <span className="text-xs text-muted-foreground">• {selectedProperty.city}</span>
                                )}
                            </span>
                        ) : (
                            "Select property..."
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">All Properties</span>
                            <span className="text-xs text-muted-foreground ml-2">({activePropertiesCount})</span>
                        </div>
                    </SelectItem>
                    {properties.filter(p => p.is_active).map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{property.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {property.property_type} {property.city ? `• ${property.city}` : ''}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-primary/20 hover:bg-primary/10">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-primary/20 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Add New Property
                        </DialogTitle>
                    </DialogHeader>
                    <form action={handleAddProperty} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Property Name *</Label>
                            <Input id="name" name="name" placeholder="Grand Hotel" required className="bg-input border-primary/20" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="property_type">Type *</Label>
                                <Select onValueChange={setNewPropertyType} defaultValue="apartment">
                                    <SelectTrigger className="bg-input border-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hotel">Hotel</SelectItem>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="villa">Villa</SelectItem>
                                        <SelectItem value="condo">Condo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="base_price">Base Price ($) *</Label>
                                <Input id="base_price" name="base_price" type="number" placeholder="100" required className="bg-input border-primary/20" />
                            </div>
                        </div>

                        {/* Structure Details Section */}
                        <div className="p-3 bg-secondary/20 rounded-lg space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property Structure</div>
                            {newPropertyType === 'hotel' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="floors">Number of Floors</Label>
                                    <Input id="floors" name="floors" type="number" placeholder="5" className="bg-input border-primary/20" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bedrooms">Bedrooms</Label>
                                        <Input id="bedrooms" name="bedrooms" type="number" placeholder="2" className="bg-input border-primary/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bathrooms">Bathrooms</Label>
                                        <Input id="bathrooms" name="bathrooms" type="number" placeholder="1" className="bg-input border-primary/20" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Caretaker / Staff Section */}
                        <div className="p-3 bg-secondary/20 rounded-lg space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Caretaker / Staff (Optional)</div>
                            <div className="space-y-2">
                                <Label htmlFor="caretaker_name">Name</Label>
                                <Input id="caretaker_name" name="caretaker_name" placeholder="John Doe" className="bg-input border-primary/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="caretaker_phone">Phone</Label>
                                    <Input id="caretaker_phone" name="caretaker_phone" placeholder="+1 555-0123" className="bg-input border-primary/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="caretaker_email">Email</Label>
                                    <Input id="caretaker_email" name="caretaker_email" type="email" placeholder="john@example.com" className="bg-input border-primary/20" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" name="city" placeholder="New York" className="bg-input border-primary/20" />
                        </div>

                        <Button type="submit" className="w-full bg-gradient-primary">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Property
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
