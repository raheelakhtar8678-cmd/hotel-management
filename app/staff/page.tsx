"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Users, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Staff {
    id: string;
    name: string;
    role: string;
    property_id: string;
    property_name?: string;
    assigned_room_id?: string;
    room_name?: string;
    work_start_time?: string;
    work_end_time?: string;
    contact_phone?: string;
    contact_email?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    status: string;
}

interface Property {
    id: string;
    name: string;
}

interface Room {
    id: string;
    name: string;
    type: string;
    property_id: string;
}

export default function StaffPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [activeRole, setActiveRole] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: 'reception',
        property_id: '',
        assigned_room_id: '',
        work_start_time: '',
        work_end_time: '',
        contact_phone: '',
        contact_email: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [staffRes, propsRes, roomsRes] = await Promise.all([
                fetch('/api/staff'),
                fetch('/api/properties'),
                fetch('/api/rooms?all=true') // Assuming existing API supports listing all or we need to fix
            ]);

            // Check responses
            if (!staffRes.ok) {
                throw new Error(`Staff fetch failed: ${staffRes.status}`);
            }
            if (!propsRes.ok) {
                throw new Error(`Properties fetch failed: ${propsRes.status}`);
            }

            const staffData = await staffRes.json();
            const propsData = await propsRes.json();

            if (staffData.success) setStaffList(staffData.staff);
            if (propsData.success) setProperties(propsData.properties);

        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoomsForProperty = async (propertyId: string) => {
        try {
            const res = await fetch(`/api/rooms?property_id=${propertyId}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
                setRooms(data.rooms);
            }
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    };

    const handlePropertyChange = (value: string) => {
        setFormData(prev => ({ ...prev, property_id: value, assigned_room_id: '' }));
        // Fetch rooms for this property
        fetchRoomsForProperty(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setStaffList([data.staff, ...staffList]);
                setIsDialogOpen(false);
                setFormData({
                    name: '',
                    role: 'reception',
                    property_id: '',
                    assigned_room_id: '',
                    work_start_time: '',
                    work_end_time: '',
                    contact_phone: '',
                    contact_email: '',
                    emergency_contact_name: '',
                    emergency_contact_phone: ''
                });
            } else {
                alert(data.error || 'Failed to add staff');
            }
        } catch (error) {
            alert('Error adding staff');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        try {
            const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
                setStaffList(staffList.filter(s => s.id !== id));
            } else {
                alert(data.error || 'Failed to delete staff member');
            }
        } catch (error) {
            alert('Failed to delete staff member');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading staff...</div>;

    return (
        <div className="flex-1 p-8 pt-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">Staff Management</h2>
                    <p className="text-muted-foreground">Manage employees, shifts, and assignments</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-primary">
                            <Plus className="mr-2 h-4 w-4" /> Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>
                                Enter staff details, contact info, and assignments.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reception">Reception</SelectItem>
                                            <SelectItem value="cleaning">Cleaning</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="food_delivery">Food Delivery</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="property">Assigned Property *</Label>
                                    <Select
                                        value={formData.property_id}
                                        onValueChange={handlePropertyChange}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="room">Assigned Room (Optional)</Label>
                                <Select
                                    value={formData.assigned_room_id}
                                    onValueChange={v => setFormData({ ...formData, assigned_room_id: v })}
                                    disabled={!formData.property_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={formData.property_id ? "Select Room" : "Select Property First"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name || r.type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Work Hours (Start)</Label>
                                    <Input
                                        type="time"
                                        value={formData.work_start_time}
                                        onChange={e => setFormData({ ...formData, work_start_time: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Work Hours (End)</Label>
                                    <Input
                                        type="time"
                                        value={formData.work_end_time}
                                        onChange={e => setFormData({ ...formData, work_end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.contact_phone}
                                        onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                        placeholder="jane@example.com"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-medium mb-4">Emergency Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="e_name">Contact Name</Label>
                                        <Input
                                            id="e_name"
                                            value={formData.emergency_contact_name}
                                            onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="e_phone">Contact Phone</Label>
                                        <Input
                                            id="e_phone"
                                            type="tel"
                                            value={formData.emergency_contact_phone}
                                            onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Adding...' : 'Add Staff Member'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Role Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                {['all', 'cleaning', 'maintenance', 'food_delivery', 'reception', 'manager'].map((role) => (
                    <Button
                        key={role}
                        variant={activeRole === role ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveRole(role)}
                        className={`capitalize ${activeRole === role ? 'bg-gradient-primary border-0' : ''}`}
                    >
                        {role.replace('_', ' ')}
                    </Button>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {staffList.filter(s => activeRole === 'all' || s.role === activeRole).map((staff) => (
                    <Card key={staff.id} className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                {staff.name}
                            </CardTitle>
                            <div className="flex flex-col items-end">
                                <Badge variant="outline" className="text-xs mb-1 capitalize border-primary/20">
                                    {staff.role?.replace('_', ' ') || 'Staff'}
                                </Badge>
                                <Badge variant={staff.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                    {staff.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {/* Assignment */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span>{staff.property_name || 'No Property'}</span>
                                </div>
                                {staff.assigned_room_id && (
                                    <div className="flex items-center text-muted-foreground pl-6">
                                        ➤ Assigned: {staff.room_name || `Room ${staff.assigned_room_id.slice(0, 4)}...`}
                                    </div>
                                )}
                            </div>

                            {/* Hours */}
                            {(staff.work_start_time || staff.work_end_time) && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-2" />
                                    {staff.work_start_time || '?'} - {staff.work_end_time || '?'}
                                </div>
                            )}

                            {/* Contact */}
                            <div className="space-y-1 pt-2 border-t border-border/50">
                                {staff.contact_phone && (
                                    <div className="flex items-center text-sm">
                                        <Phone className="h-3 w-3 mr-2 opacity-70" />
                                        {staff.contact_phone}
                                    </div>
                                )}
                                {staff.contact_email && (
                                    <div className="flex items-center text-sm">
                                        <Mail className="h-3 w-3 mr-2 opacity-70" />
                                        {staff.contact_email}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(staff.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {staffList.length === 0 && !loading && (
                    <div className="col-span-full text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No staff members found. Click "Add Staff" to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
