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
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Plus,
    RefreshCw,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface CalendarConnection {
    id: string;
    property_id: string;
    room_id?: string;
    platform: string;
    ical_url: string;
    name: string;
    is_active: boolean;
    sync_status: 'pending' | 'syncing' | 'success' | 'error';
    last_sync_at?: string;
    last_sync_count?: number;
    last_error?: string;
}

interface Property {
    id: string;
    name: string;
}

export function CalendarSyncWidget() {
    const [connections, setConnections] = useState<CalendarConnection[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        property_id: '',
        platform: 'airbnb',
        ical_url: '',
        name: ''
    });

    useEffect(() => {
        fetchConnections();
        fetchProperties();
    }, []);

    const fetchConnections = async () => {
        try {
            const response = await fetch('/api/calendar-connections');
            const data = await response.json();

            if (data.success) {
                setConnections(data.connections || []);
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties');
            const data = await response.json();

            if (data.success) {
                setProperties(data.properties || []);
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        }
    };

    const handleAddConnection = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/calendar-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Calendar connected! Sync will start automatically.');
                setDialogOpen(false);
                setFormData({ property_id: '', platform: 'airbnb', ical_url: '', name: '' });
                fetchConnections();

                // Trigger initial sync
                syncConnection(data.connection.id);
            } else {
                alert(data.error || 'Failed to add calendar connection');
            }
        } catch (error) {
            console.error('Error adding connection:', error);
            alert('Network error. Please try again.');
        }
    };

    const syncConnection = async (connectionId: string) => {
        setSyncing(connectionId);

        try {
            const response = await fetch('/api/sync-calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connection_id: connectionId })
            });

            const data = await response.json();

            if (data.success) {
                const result = data.results?.[0];
                alert(`Sync complete! Imported ${result?.imported || 0} booking(s). Conflicts: ${result?.conflicts || 0}`);
                fetchConnections();
            } else {
                alert('Sync failed. Check calendar URL.');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Sync error. Please try again.');
        } finally {
            setSyncing(null);
        }
    };

    const syncAllConnections = async () => {
        setSyncing('all');

        try {
            const response = await fetch('/api/sync-calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.success) {
                alert(`Synced all calendars! Total imported: ${data.totalImported}, Conflicts: ${data.totalConflicts}`);
                fetchConnections();
            } else {
                alert('Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Sync error');
        } finally {
            setSyncing(null);
        }
    };

    const deleteConnection = async (id: string) => {
        if (!confirm('Remove this calendar connection?')) return;

        try {
            const response = await fetch(`/api/calendar-connections?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchConnections();
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const getSyncStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'syncing': return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getPlatformBadge = (platform: string) => {
        const colors: Record<string, string> = {
            airbnb: 'bg-red-500/10 text-red-500 border-red-500/20',
            vrbo: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            booking_com: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
            other: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
        };

        return (
            <Badge variant="outline" className={colors[platform] || colors.other}>
                {platform.replace('_', '.').toUpperCase()}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Loading calendar connections...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Calendar Sync ({connections.length})
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Import bookings from Airbnb, Vrbo, and other platforms
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {connections.length > 0 && (
                            <Button
                                onClick={syncAllConnections}
                                disabled={syncing !== null}
                                size="sm"
                                variant="outline"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${syncing === 'all' ? 'animate-spin' : ''}`} />
                                Sync All
                            </Button>
                        )}
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Calendar
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Connect External Calendar</DialogTitle>
                                    <DialogDescription>
                                        Add an iCal feed URL from Airbnb, Vrbo, or Booking.com
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddConnection} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Property *</Label>
                                        <Select
                                            value={formData.property_id}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value }))}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select property" />
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
                                        <Label>Platform *</Label>
                                        <Select
                                            value={formData.platform}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="airbnb">Airbnb</SelectItem>
                                                <SelectItem value="vrbo">Vrbo / HomeAway</SelectItem>
                                                <SelectItem value="booking_com">Booking.com</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Calendar Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="My Airbnb Calendar"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>iCal URL *</Label>
                                        <Input
                                            value={formData.ical_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, ical_url: e.target.value }))}
                                            placeholder="https://www.airbnb.com/calendar/ical/..."
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Find this in your platform's export/sync settings
                                        </p>
                                    </div>

                                    <Button type="submit" className="w-full">
                                        Connect Calendar
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {connections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2">No calendar connections yet</p>
                        <p className="text-sm">Import bookings from Airbnb, Vrbo, and more</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {connections.map((connection) => (
                            <div
                                key={connection.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm">{connection.name}</p>
                                        {getPlatformBadge(connection.platform)}
                                        {getSyncStatusIcon(connection.sync_status)}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {connection.last_sync_at
                                            ? `Last sync: ${new Date(connection.last_sync_at).toLocaleString()} (${connection.last_sync_count || 0} imported)`
                                            : 'Never synced'}
                                    </p>
                                    {connection.last_error && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3 text-red-500" />
                                            <p className="text-xs text-red-500">{connection.last_error}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-2">
                                    <Button
                                        onClick={() => syncConnection(connection.id)}
                                        disabled={syncing !== null}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${syncing === connection.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                        onClick={() => deleteConnection(connection.id)}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
