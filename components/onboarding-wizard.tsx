"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Building2,
    DollarSign,
    Calendar,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingWizardProps {
    onComplete?: () => void;
}

const STEPS = [
    {
        id: 1,
        title: "Welcome to YieldVibe",
        description: "Let's set up your first property in 5 simple steps",
        icon: Sparkles
    },
    {
        id: 2,
        title: "Property Basics",
        description: "Tell us about your property",
        icon: Building2
    },
    {
        id: 3,
        title: "Pricing Strategy",
        description: "Set your base pricing",
        icon: DollarSign
    },
    {
        id: 4,
        title: "Calendar Sync (Optional)",
        description: "Connect your Airbnb or VRBO calendar",
        icon: Calendar
    },
    {
        id: 5,
        title: "You're All Set!",
        description: "Start maximizing your revenue",
        icon: CheckCircle2
    }
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        propertyName: "",
        propertyType: "apartment",
        city: "",
        country: "USA",
        bedrooms: "1",
        bathrooms: "1",
        maxGuests: "2",
        basePrice: "100",
        icalUrl: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNext = async () => {
        if (currentStep === 3) {
            // Create property on step 3
            await createProperty();
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const createProperty = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.propertyName,
                    property_type: formData.propertyType,
                    city: formData.city,
                    country: formData.country,
                    bedrooms: Number(formData.bedrooms),
                    bathrooms: Number(formData.bathrooms),
                    max_guests: Number(formData.maxGuests),
                    base_price: Number(formData.basePrice),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create property');
            }
        } catch (error) {
            console.error('Error creating property:', error);
            alert('Failed to create property. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const finishOnboarding = () => {
        // Mark onboarding as complete
        if (typeof window !== 'undefined') {
            localStorage.setItem('yieldvibe_onboarding_complete', 'true');
        }
        onComplete?.();
        router.push('/');
    };

    const canProceed = () => {
        if (currentStep === 2) {
            return formData.propertyName && formData.city;
        }
        if (currentStep === 3) {
            return formData.basePrice && Number(formData.basePrice) > 0;
        }
        return true;
    };

    const CurrentStepIcon = STEPS[currentStep - 1].icon;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="glass-card max-w-2xl w-full">
                <CardHeader>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-6">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex-1">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${index + 1 <= currentStep
                                            ? 'bg-gradient-primary'
                                            : 'bg-secondary/30'
                                        }`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <CurrentStepIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <Badge variant="outline" className="mb-2">
                                Step {currentStep} of {STEPS.length}
                            </Badge>
                            <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
                        </div>
                    </div>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Step 1: Welcome */}
                    {currentStep === 1 && (
                        <div className="text-center py-8">
                            <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Welcome to YieldVibe Pro!</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                You're about to unlock enterprise-level revenue management for your properties.
                                This quick setup will take less than 5 minutes.
                            </p>
                            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-left max-w-md mx-auto">
                                <p className="font-medium mb-2">What you'll get:</p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        AI-powered pricing insights
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Automated revenue optimization
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Multi-property management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Professional reporting
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Property Basics */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="propertyName">Property Name *</Label>
                                <Input
                                    id="propertyName"
                                    placeholder="e.g., Beach House Miami"
                                    value={formData.propertyName}
                                    onChange={(e) => handleChange('propertyName', e.target.value)}
                                    className="bg-input border-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="propertyType">Property Type *</Label>
                                    <Select
                                        value={formData.propertyType}
                                        onValueChange={(value) => handleChange('propertyType', value)}
                                    >
                                        <SelectTrigger className="bg-input border-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="apartment">Apartment</SelectItem>
                                            <SelectItem value="house">House</SelectItem>
                                            <SelectItem value="condo">Condo</SelectItem>
                                            <SelectItem value="villa">Villa</SelectItem>
                                            <SelectItem value="hotel">Hotel</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        placeholder="San Francisco"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Bedrooms</Label>
                                    <Input
                                        id="bedrooms"
                                        type="number"
                                        min="0"
                                        value={formData.bedrooms}
                                        onChange={(e) => handleChange('bedrooms', e.target.value)}
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
                                        onChange={(e) => handleChange('bathrooms', e.target.value)}
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxGuests">Max Guests</Label>
                                    <Input
                                        id="maxGuests"
                                        type="number"
                                        min="1"
                                        value={formData.maxGuests}
                                        onChange={(e) => handleChange('maxGuests', e.target.value)}
                                        className="bg-input border-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Pricing Strategy */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="basePrice">Base Nightly Price ($) *</Label>
                                <Input
                                    id="basePrice"
                                    type="number"
                                    min="1"
                                    placeholder="100"
                                    value={formData.basePrice}
                                    onChange={(e) => handleChange('basePrice', e.target.value)}
                                    className="bg-input border-primary/20 text-2xl font-bold text-center"
                                />
                                <p className="text-sm text-muted-foreground text-center">
                                    This is your standard rate during normal demand
                                </p>
                            </div>

                            <div className="bg-secondary/30 rounded-lg p-4">
                                <p className="font-medium mb-3">YieldVibe will automatically:</p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Adjust prices up to 30% based on demand</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Apply last-minute discounts to fill gaps</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Add weekend premiums (configurable)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Respect your floor and ceiling price limits</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Calendar Sync */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="bg-secondary/30 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Connect your existing booking calendar to sync reservations automatically
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="icalUrl">iCal URL (Optional)</Label>
                                <Input
                                    id="icalUrl"
                                    type="url"
                                    placeholder="https://www.airbnb.com/calendar/ical/..."
                                    value={formData.icalUrl}
                                    onChange={(e) => handleChange('icalUrl', e.target.value)}
                                    className="bg-input border-primary/20"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Find this in your Airbnb/Vrbo calendar settings under "Export Calendar"
                                </p>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <p className="mb-2">📅 You can always add this later in Settings → Calendar Sync</p>
                                <p>💡 Tip: We support Airbnb, Vrbo, Booking.com, and custom iCal feeds</p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Complete */}
                    {currentStep === 5 && (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                            <h3 className="text-2xl font-semibold mb-2">🎉 You're All Set!</h3>
                            <p className="text-muted-foreground mb-6">
                                Your property <strong>{formData.propertyName}</strong> is ready to start earning more revenue
                            </p>
                            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-left max-w-md mx-auto">
                                <p className="font-medium mb-3">Next steps:</p>
                                <ul className="space-y-2">
                                    <li>✅ View your dashboard</li>
                                    <li>✅ Configure AI pricing rules</li>
                                    <li>✅ Connect your calendar (if not done)</li>
                                    <li>✅ Generate your first revenue report</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1 || loading}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={!canProceed() || loading}
                            className="bg-gradient-primary hover:opacity-90"
                        >
                            {loading ? (
                                'Creating...'
                            ) : currentStep === STEPS.length ? (
                                <>
                                    Go to Dashboard
                                    <Sparkles className="h-4 w-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
