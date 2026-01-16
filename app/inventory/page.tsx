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
import { Plus, Package, X, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [extras, setExtras] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [showExtrasDialog, setShowExtrasDialog] = useState(false);
    const [newExtra, setNewExtra] = useState({
        item_name: '',
        price: '',
        quantity: 1,
        item_category: 'other'
    });

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
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
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

    const getRoomExtras = (roomId: string) => {
        return extras.filter(e => e.room_id === roomId);
    };

    const calculateRoomTotal = (room: any) => {
        const basePrice = Number(room?.current_price) || 0;
        const roomExtras = room?.id ? getRoomExtras(room.id) : [];
        const extrasTotal = roomExtras.reduce((sum, e) => sum + (Number(e.price) * Number(e.quantity)), 0);
        return basePrice + extrasTotal;
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
                <Link href="/inventory/add-room">
                    <Button className="bg-gradient-primary hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md border-primary/20">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Room ID</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Extras</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room) => {
                            const property = propertyMap.get(room.property_id);
                            const roomExtras = getRoomExtras(room.id);
                            const extrasTotal = roomExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
                            const total = calculateRoomTotal(room);

                            return (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">{room.id ? `${room.id.slice(0, 8)}...` : 'N/A'}</TableCell>
                                    <TableCell>{property?.name}</TableCell>
                                    <TableCell>{room.type || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <Badge variant={room.status === 'available' ? 'default' : 'secondary'}>
                                            {room.status || 'unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${room.current_price ?? property?.base_price}</TableCell>
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedRoom(room);
                                                setShowExtrasDialog(true);
                                            }}
                                        >
                                            <Package className="h-4 w-4 mr-1" />
                                            Extras
                                        </Button>
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
