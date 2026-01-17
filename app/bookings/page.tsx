'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, RotateCcw, Calendar, DollarSign, AlertTriangle } from "lucide-react";

interface Booking {
    id: string;
    room_id: string;
    guest_name: string;
    guest_email: string | null;
    check_in: string;
    check_out: string;
    total_paid: number;
    status: string;
    channel: string;
    room_type?: string;
    property_name?: string;
    refund_amount?: number;
    refund_reason?: string;
    refunded_at?: string;
    created_at: string;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings');
            const data = await res.json();
            if (data.success) {
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const openRefundDialog = (booking: Booking) => {
        setSelectedBooking(booking);
        setRefundAmount(booking.total_paid.toString());
        setRefundReason('');
        setShowRefundDialog(true);
    };

    const handleRefund = async () => {
        if (!selectedBooking || !refundAmount) {
            alert('Please enter a refund amount');
            return;
        }

        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid refund amount');
            return;
        }

        if (amount > selectedBooking.total_paid) {
            alert('Refund amount cannot exceed the total paid amount');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: selectedBooking.id,
                    refund_amount: amount,
                    refund_reason: refundReason || 'No reason provided'
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Refund processed successfully');
                setShowRefundDialog(false);
                fetchBookings(); // Refresh the list
            } else {
                alert(data.error || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            alert('Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string, refundAmount?: number) => {
        if (status === 'refunded' || (refundAmount && refundAmount > 0)) {
            return <Badge variant="destructive">Refunded</Badge>;
        }
        if (status === 'confirmed') {
            return <Badge variant="default" className="bg-emerald-600">Confirmed</Badge>;
        }
        if (status === 'cancelled') {
            return <Badge variant="secondary">Cancelled</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate summary stats
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.total_paid) || 0), 0);
    const totalRefunds = bookings.reduce((sum, b) => sum + (Number(b.refund_amount) || 0), 0);
    const netRevenue = totalRevenue - totalRefunds;
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
    const refundedBookings = bookings.filter(b => b.status === 'refunded' || (b.refund_amount && b.refund_amount > 0)).length;

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
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight gradient-text flex items-center gap-2">
                    <Calendar className="h-8 w-8" />
                    Bookings
                </h2>
                <p className="text-muted-foreground mt-1">
                    View and manage all bookings, process refunds
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bookings.length}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{activeBookings}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${netRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            -${totalRefunds.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({refundedBookings} bookings)
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bookings Table */}
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Guest</TableHead>
                                <TableHead>Property / Room</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Refund</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell>
                                        <div className="font-medium">{booking.guest_name}</div>
                                        {booking.guest_email && (
                                            <div className="text-xs text-muted-foreground">{booking.guest_email}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div>{booking.property_name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">{booking.room_type || 'Room'}</div>
                                    </TableCell>
                                    <TableCell>{formatDate(booking.check_in)}</TableCell>
                                    <TableCell>{formatDate(booking.check_out)}</TableCell>
                                    <TableCell className="font-semibold">${Number(booking.total_paid).toFixed(2)}</TableCell>
                                    <TableCell>{getStatusBadge(booking.status, booking.refund_amount)}</TableCell>
                                    <TableCell>
                                        {booking.refund_amount && booking.refund_amount > 0 ? (
                                            <div>
                                                <span className="text-red-500 font-semibold">
                                                    -${Number(booking.refund_amount).toFixed(2)}
                                                </span>
                                                {booking.refund_reason && (
                                                    <div className="text-xs text-muted-foreground max-w-[150px] truncate" title={booking.refund_reason}>
                                                        {booking.refund_reason}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {booking.status === 'confirmed' && (!booking.refund_amount || Number(booking.refund_amount) === 0) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openRefundDialog(booking)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                Refund
                                            </Button>
                                        )}
                                        {(booking.status === 'refunded' || (booking.refund_amount && Number(booking.refund_amount) > 0)) && (
                                            <span className="text-xs text-muted-foreground">Refunded</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {bookings.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No bookings found</p>
                            <p className="text-sm">Create bookings using the Calculator page</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Refund Dialog */}
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Process Refund
                        </DialogTitle>
                        <DialogDescription>
                            This will refund the booking and set the room back to available.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Guest:</span>
                                    <span className="font-medium">{selectedBooking.guest_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Paid:</span>
                                    <span className="font-medium">${Number(selectedBooking.total_paid).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dates:</span>
                                    <span className="font-medium">
                                        {formatDate(selectedBooking.check_in)} - {formatDate(selectedBooking.check_out)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="refundAmount">Refund Amount ($) *</Label>
                                <Input
                                    id="refundAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={selectedBooking.total_paid}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    placeholder="Enter refund amount"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    For partial refund, enter less than ${Number(selectedBooking.total_paid).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="refundReason">Refund Reason</Label>
                                <Textarea
                                    id="refundReason"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="e.g., Guest cancelled, Room issue, etc."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRefundDialog(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleRefund}
                                    disabled={processing}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    {processing ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                    )}
                                    Process Refund
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
