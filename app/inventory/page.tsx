'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Plus, Package, X, RefreshCw, Settings, Calendar, Link as LinkIcon, Trash2, MoreVertical, CheckCircle2, Clock, Wrench } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [extras, setExtras] = useState<any[]>([]);
    const [pricingRules, setPricingRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [showExtrasDialog, setShowExtrasDialog] = useState(false);
    const [newExtra, setNewExtra] = useState({
        item_name: '',
        price: '',
        quantity: 1,

        item_category: 'other'
    });
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [icalUrl, setIcalUrl] = useState('');

    // Room Details State
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [currentBooking, setCurrentBooking] = useState<any>(null);
    const [bookingExtras, setBookingExtras] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch properties
            const propsRes = await fetch('/api/properties');
            const propsData = await propsRes.json();
            setProperties(propsData.properties || []);

            // Fetch all rooms
            const roomsRes = await fetch('/api/rooms');
            if (roomsRes.ok) {
                const roomsData = await roomsRes.json();
                setRooms(roomsData.rooms || []);
            }

            // Fetch all extras
            const extrasRes = await fetch('/api/room-extras');
            if (extrasRes.ok) {
                const extrasData = await extrasRes.json();
                setExtras(extrasData.extras || []);
            }

            // Fetch active pricing rules
            const rulesRes = await fetch('/api/pricing-rules?is_active=true');
            if (rulesRes.ok) {
                const rulesData = await rulesRes.json();
                setPricingRules(rulesData.rules || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room? This will also delete all extras for this room.')) {
            return;
        }

        try {
            const response = await fetch(`/api/rooms?id=${roomId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh data
                fetchData();
            } else {
                alert('Failed to delete room');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            alert('Error deleting room');
        }
    };

    const updateRoomStatus = async (roomId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/rooms', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: roomId, status: newStatus })
            });

            if (response.ok) {
                // Refresh data
                fetchData();
            } else {
                alert('Failed to update room status');
            }
        } catch (error) {
            console.error('Error updating room status:', error);
            alert('Error updating room status');
        }
    };

    const handleAddExtra = async () => {
        if (!selectedRoom || !newExtra.item_name || !newExtra.price) {
            alert('Please enter item name and price');
            return;
        }

        try {
            const response = await fetch('/api/room-extras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: selectedRoom.id,
                    ...newExtra,
                    price: parseFloat(newExtra.price)
                })
            });

            const data = await response.json();
            if (data.success) {
                setExtras([...extras, data.extra]);
                setNewExtra({ item_name: '', price: '', quantity: 1, item_category: 'other' });
                alert('Extra added successfully!');
            }
        } catch (error) {
            console.error('Error adding extra:', error);
            alert('Failed to add extra');
        }
    };

    const handleDeleteExtra = async (extraId: string) => {
        if (!confirm('Delete this extra?')) return;

        try {
            const response = await fetch(`/api/room-extras?id=${extraId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setExtras(extras.filter(e => e.id !== extraId));
            }
        } catch (error) {
            console.error('Error deleting extra:', error);
        }
    };

    const handleUpdateRoom = async () => {
        if (!selectedRoom) return;
        setLoading(true); // Re-use loading or create saving state
        try {
            const res = await fetch(`/api/rooms/${selectedRoom.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ical_url: icalUrl })
            });
            if (res.ok) {
                alert('Settings saved!');
                setShowSettingsDialog(false);
                fetchData(); // Refresh to get new data if needed
            } else {
                alert('Failed to save settings');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!selectedRoom) return;
        setSyncing(true);
        try {
            const res = await fetch(`/api/rooms/${selectedRoom.id}/sync`, { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(`Sync complete! Added ${data.added} bookings.`);
            } else {
                alert(`Sync failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error running sync');
        } finally {
            setSyncing(false);
        }
    };

    const handleViewDetails = async (room: any) => {
        setSelectedRoom(room);
        setShowDetailsDialog(true);
        setCurrentBooking(null);
        setBookingExtras([]);

        if (room.status === 'occupied') {
            try {
                // Fetch latest booking
                const res = await fetch(`/api/bookings?room_id=${room.id}`);
                const data = await res.json();
                if (data.bookings && data.bookings.length > 0) {
                    // Assuming API returns sorted by check_in DESC, take the first one (active/latest)
                    // Better logic would be to find one where status=confirmed and today is between checkin/checkout
                    const active = data.bookings.find((b: any) => b.status === 'confirmed') || data.bookings[0];
                    setCurrentBooking(active);

                    // Filter extras for this booking if possible, or just for the room
                    // Currently extras are fetched for room, but we can filter by booking_id if we store it
                    // For now, we show room extras as they are attached to the room in this system's logic
                    // But typically extras should be attached to booking. 
                    // The current system attaches to room_id (checking schema... room_extras has booking_id)
                    // So we should filter by booking_id if available.

                    if (active) {
                        const bookingExtras = extras.filter(e => e.booking_id === active.id || e.room_id === room.id); // Fallback to room_id for now
                        setBookingExtras(bookingExtras);
                    }
                }
            } catch (e) {
                console.error("Error fetching booking details:", e);
            }
        } else {
            // For available rooms, just show room-attached extras if any (usually extras are per booking)
            setBookingExtras(extras.filter(e => e.room_id === room.id && !e.booking_id));
        }
    };

    const getRoomExtras = (roomId: string) => {
        return extras.filter(e => e.room_id === roomId);
    };

    const calculateEffectivePrice = (room: any) => {
        const basePrice = Number(room?.current_price || 0);
        if (!room) return { price: basePrice, reasons: [] };

        let adjustedPrice = basePrice;
        let reasons: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);



        // Find rules for this property
        const activeRules = pricingRules.filter(r => r.property_id === room.property_id);

        activeRules.forEach(rule => {
            let applies = false;
            // Check Date Range (Seasonal, Event, etc.)
            if (rule.date_from && rule.date_to) {
                const start = new Date(rule.date_from);
                start.setHours(0, 0, 0, 0);
                const end = new Date(rule.date_to);
                end.setHours(23, 59, 59, 999);

                if (today >= start && today <= end) {
                    applies = true;
                } else {
                    applies = false; // logic hierarchy: range must match if present
                }
            }

            // Check Days of Week (Weekend, etc.)
            if (rule.days_of_week && rule.days_of_week.length > 0) {
                const day = today.getDay();
                if (rule.days_of_week.includes(day)) {
                    // If date range was checked and passed (or not present), and day matches -> applies
                    if (!rule.date_from || applies) applies = true;
                } else {
                    applies = false;
                }
            } else if (rule.rule_type === 'weekend' && (!rule.days_of_week || rule.days_of_week.length === 0)) {
                // Fallback for old weekend rules without specific days
                const day = today.getDay();
                if (day === 5 || day === 6) applies = true;
            } else if (rule.rule_type === 'last_minute') {
                // Assuming "Today" counts as 0 days before checkin
                if (rule.conditions.days_before_checkin >= 0) applies = true;
            }

            // Simplified logic: If we have dates/days, they dictate 'applies'. 
            // If we have neither (e.g. simple global rule), it might apply by default? 
            // For now, assume 'seasonal'/'event' implies date requirement.

            if (applies) {
                const action = rule.action;
                const val = Number(action.value);
                if (action.type === 'surge') {
                    const amount = action.unit === 'percent' ? basePrice * (val / 100) : val;
                    adjustedPrice += amount;
                    reasons.push(`+${action.unit === 'percent' ? val + '%' : '$' + val} ${rule.name}`);
                } else if (action.type === 'discount') {
                    const amount = action.unit === 'percent' ? basePrice * (val / 100) : val;
                    adjustedPrice -= amount;
                    reasons.push(`-${action.unit === 'percent' ? val + '%' : '$' + val} ${rule.name}`);
                }
            }
        });

        return { price: adjustedPrice, reasons };
    };

    const calculateRoomTotal = (room: any) => {
        const { price: effectivePrice } = calculateEffectivePrice(room);
        const roomExtras = room?.id ? getRoomExtras(room.id) : [];
        const extrasTotal = roomExtras.reduce((sum, e) => sum + (Number(e.price) * Number(e.quantity)), 0);
        return effectivePrice + extrasTotal;
    };

    const propertyMap = new Map(properties.map(p => [p.id, p]));

    if (loading) {
        return (
            <div className="flex-1 p-8 pt-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">
                        Inventory
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage rooms, pricing, and extras across all properties
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/settings">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Taxes
                        </Button>
                    </Link>
                    <Link href="/inventory/add-room">
                        <Button className="bg-gradient-primary hover:opacity-90">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Room
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="border rounded-md border-primary/20">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Room Name</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Today's Rate</TableHead>
                            <TableHead>Extras</TableHead>
                            <TableHead>Total Est.</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room) => {
                            const property = propertyMap.get(room.property_id);
                            const roomExtras = getRoomExtras(room.id);
                            const extrasTotal = roomExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
                            const effective = calculateEffectivePrice(room);
                            const total = effective.price + extrasTotal;

                            return (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">
                                        <button
                                            onClick={() => handleViewDetails(room)}
                                            className="hover:underline text-primary text-left font-semibold"
                                        >
                                            {room.name || (room.id ? `${room.id.slice(0, 8)}...` : 'N/A')}
                                        </button>
                                    </TableCell>
                                    <TableCell>{property?.name}</TableCell>
                                    <TableCell>{room.type || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Badge
                                                    variant={room.status === 'available' ? 'default' : room.status === 'occupied' ? 'secondary' : 'outline'}
                                                    className={`cursor-pointer hover:opacity-80 ${room.status === 'available' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                                                        room.status === 'occupied' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                                                            'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                                        }`}
                                                >
                                                    {room.status || 'unknown'}
                                                </Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    onClick={() => updateRoomStatus(room.id, 'available')}
                                                    disabled={room.status === 'available'}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                                    Available
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => updateRoomStatus(room.id, 'occupied')}
                                                    disabled={room.status === 'occupied'}
                                                >
                                                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                                    Occupied
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => updateRoomStatus(room.id, 'maintenance')}
                                                    disabled={room.status === 'maintenance'}
                                                >
                                                    <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                                                    Maintenance
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>${Number(room.current_price ?? property?.base_price).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${effective.price > (room.current_price ?? property?.base_price)
                                                    ? 'text-red-500'
                                                    : effective.price < (room.current_price ?? property?.base_price)
                                                        ? 'text-green-600'
                                                        : ''
                                                    }`}>
                                                    ${effective.price.toFixed(2)}
                                                </span>
                                                {effective.reasons.length > 0 && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            {effective.reasons.length > 0 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {effective.reasons.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {roomExtras.length > 0 ? (
                                            <div className="text-sm">
                                                <span className="text-emerald-600 font-semibold">+${extrasTotal.toFixed(2)}</span>
                                                <div className="text-xs text-muted-foreground">
                                                    {roomExtras.length} item{roomExtras.length > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-600">
                                        ${total.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRoom(room);
                                                    setShowExtrasDialog(true);
                                                }}
                                            >
                                                Extras
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => updateRoomStatus(room.id, 'available')}
                                                        disabled={room.status === 'available'}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                                        Set Available
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => updateRoomStatus(room.id, 'occupied')}
                                                        disabled={room.status === 'occupied'}
                                                    >
                                                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                                        Set Occupied
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => updateRoomStatus(room.id, 'maintenance')}
                                                        disabled={room.status === 'maintenance'}
                                                    >
                                                        <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                                                        Set Maintenance
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedRoom(room);
                                                            setIcalUrl(room.ical_url || '');
                                                            setShowSettingsDialog(true);
                                                        }}
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        iCal Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => deleteRoom(room.id)}
                                                        className="text-red-500 focus:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete Room
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Extras Dialog */}
            <Dialog open={showExtrasDialog} onOpenChange={setShowExtrasDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Extras - Room {selectedRoom?.type}</DialogTitle>
                        <DialogDescription>
                            Add custom items and services for this room
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Add New Extra */}
                        <div className="border rounded-lg p-4 bg-secondary/20">
                            <h4 className="font-semibold mb-3">Add New Extra</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="item_name">Item Name</Label>
                                    <Input
                                        id="item_name"
                                        placeholder="e.g., Breakfast, Minibar, Parking"
                                        value={newExtra.item_name}
                                        onChange={(e) => setNewExtra({ ...newExtra, item_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={newExtra.price}
                                        onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={newExtra.quantity}
                                        onChange={(e) => setNewExtra({ ...newExtra, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                        value={newExtra.item_category}
                                        onChange={(e) => setNewExtra({ ...newExtra, item_category: e.target.value })}
                                    >
                                        <option value="food">Food</option>
                                        <option value="beverage">Beverage</option>
                                        <option value="service">Service</option>
                                        <option value="amenity">Amenity</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <Button onClick={handleAddExtra} className="w-full mt-3" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Extra
                            </Button>
                        </div>

                        {/* Current Extras */}
                        <div>
                            <h4 className="font-semibold mb-3">Current Extras</h4>
                            {selectedRoom && getRoomExtras(selectedRoom.id).length > 0 ? (
                                <div className="space-y-2">
                                    {getRoomExtras(selectedRoom.id).map((extra) => (
                                        <div
                                            key={extra.id}
                                            className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium">{extra.item_name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    ${extra.price} × {extra.quantity} = ${(extra.price * extra.quantity).toFixed(2)}
                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                        {extra.item_category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteExtra(extra.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No extras added yet
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Room Settings Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Room Settings - {selectedRoom?.name}</DialogTitle>
                        <DialogDescription>Configure external synchronization</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ical">iCal Calendar URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="ical"
                                    placeholder="https://airbnb.com/calendar/..."
                                    value={icalUrl}
                                    onChange={(e) => setIcalUrl(e.target.value)}
                                />
                                <Button variant="outline" size="icon" onClick={() => window.open(icalUrl, '_blank')} disabled={!icalUrl}>
                                    <LinkIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Paste the export link from Airbnb, Booking.com, or VRBO.
                            </p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="outline" onClick={handleSync} disabled={syncing || !selectedRoom?.ical_url}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing...' : 'Sync Now'}
                            </Button>
                            <Button onClick={handleUpdateRoom}>
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Room Details Dialog (New) */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            {selectedRoom?.name}
                            <Badge variant="outline" className={
                                selectedRoom?.status === 'occupied' ? 'bg-amber-500/10 text-amber-500' :
                                    selectedRoom?.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : ''
                            }>
                                {selectedRoom?.status}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            {selectedRoom?.type} • {propertyMap.get(selectedRoom?.property_id)?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Left Column: Room Info & Amenities */}
                        <div className="space-y-6">
                            {/* Amenities */}
                            <div className="bg-secondary/10 p-4 rounded-lg border">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Amenities
                                </h4>
                                {selectedRoom?.amenities ? (
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            try {
                                                const amns = JSON.parse(selectedRoom.amenities);
                                                return Array.isArray(amns) && amns.length > 0 ? (
                                                    amns.map((a: string) => (
                                                        <Badge key={a} variant="secondary">{a}</Badge>
                                                    ))
                                                ) : <span className="text-muted-foreground text-sm">No amenities listed</span>;
                                            } catch { return <span className="text-muted-foreground text-sm">Invalid amenity data</span>; }
                                        })()}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">No amenities listed</span>
                                )}
                            </div>

                            {/* Extras */}
                            <div>
                                <h4 className="font-semibold mb-2">Active Extras</h4>
                                {bookingExtras.length > 0 || (selectedRoom && getRoomExtras(selectedRoom.id).length > 0) ? (
                                    <div className="space-y-2 border rounded-lg p-2">
                                        {(bookingExtras.length > 0 ? bookingExtras : getRoomExtras(selectedRoom?.id || '')).map((e, idx) => (
                                            <div key={idx} className="flex justify-between text-sm p-2 bg-secondary/20 rounded">
                                                <span>{e.item_name} (x{e.quantity})</span>
                                                <span className="font-mono">${(e.price * e.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No extras added</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Guest & Booking Info */}
                        <div className="space-y-6">
                            {currentBooking ? (
                                <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{currentBooking.guest_name}</h4>
                                            <p className="text-sm text-muted-foreground">{currentBooking.guest_email || 'No email'}</p>
                                            <p className="text-sm text-muted-foreground">{currentBooking.guest_phone || 'No phone'}</p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            Booking ID: <br />
                                            <span className="font-mono">{currentBooking.id.slice(0, 8)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                        <div className="bg-background/50 p-2 rounded">
                                            <span className="block text-muted-foreground text-xs">Check In</span>
                                            <span className="font-medium">{new Date(currentBooking.check_in).toLocaleDateString()}</span>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded">
                                            <span className="block text-muted-foreground text-xs">Check Out</span>
                                            <span className="font-medium">{new Date(currentBooking.check_out).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Financials with Tax Breakdown */}
                                    <div className="pt-4 border-t border-emerald-500/20 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Start Date</span>
                                            <span>{new Date(currentBooking.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {/* Tax Display */}
                                        {currentBooking.taxes_applied && (
                                            <div className="py-2 space-y-1">
                                                {(() => {
                                                    try {
                                                        const taxes = JSON.parse(currentBooking.taxes_applied);
                                                        return Array.isArray(taxes) ? taxes.map((t: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                                                <span>{t.name} ({t.type === 'percentage' ? `${t.value}%` : 'fixed'})</span>
                                                                <span>${Number(t.amount).toFixed(2)}</span>
                                                            </div>
                                                        )) : null;
                                                    } catch { return null; }
                                                })()}
                                            </div>
                                        )}

                                        <div className="flex justify-between font-bold text-lg pt-2 border-t text-emerald-600">
                                            <span>Total Paid</span>
                                            <span>${Number(currentBooking.total_paid).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                    <Calendar className="h-12 w-12 mb-3 opacity-20" />
                                    <p>Room is currently empty</p>
                                    <p className="text-xs mt-1">No active booking found</p>

                                    <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/calculator'}>
                                        Go to Calculator
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {rooms.length === 0 && (
                <div className="border rounded-md border-primary/20 p-12 text-center">
                    <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Rooms Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Add rooms to your properties to start managing inventory
                    </p>
                    <Link href="/inventory/add-room">
                        <Button className="bg-gradient-primary">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Room
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
