'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';

interface InteractiveCalendarProps {
    propertyId?: string;
}

export default function InteractiveCalendar({ propertyId }: InteractiveCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDateBookings, setSelectedDateBookings] = useState<any[]>([]);

    useEffect(() => {
        fetchBookings();
    }, [propertyId]);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            const data = await res.json();
            if (data.success) {
                let allBookings = data.bookings || [];

                // Filter by property if specified
                if (propertyId) {
                    allBookings = allBookings.filter((b: any) => b.property_id === propertyId);
                }

                setBookings(allBookings);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get bookings for a specific date
    const getBookingsForDate = (date: Date) => {
        return bookings.filter((booking) => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            return date >= checkIn && date < checkOut;
        });
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        const dateBookings = getBookingsForDate(date);
        setSelectedDateBookings(dateBookings);
    };

    const hasBookings = (date: Date) => {
        return getBookingsForDate(date).length > 0;
    };

    const getTotalRevenue = (date: Date) => {
        const dateBookings = getBookingsForDate(date);
        return dateBookings.reduce((sum, b) => {
            const checkIn = new Date(b.check_in);
            const checkOut = new Date(b.check_out);
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            const pricePerNight = Number(b.total_paid || 0) / nights;
            return sum + pricePerNight;
        }, 0);
    };

    // Get first day of month (0 = Sunday)
    const firstDayOfMonth = monthStart.getDay();
    const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            {format(currentMonth, 'MMMM yyyy')}
                        </CardTitle>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-2 hover:bg-secondary rounded"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentMonth(new Date())}
                                className="px-3 py-1 text-sm hover:bg-secondary rounded"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-2 hover:bg-secondary rounded"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for days before month starts */}
                        {emptyDays.map((i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}

                        {/* Calendar days */}
                        {daysInMonth.map((date) => {
                            const dateHasBookings = hasBookings(date);
                            const isSelected = selectedDate && isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const revenue = getTotalRevenue(date);

                            return (
                                <div
                                    key={date.toISOString()}
                                    onClick={() => handleDateClick(date)}
                                    className={`
                                        aspect-square p-2 rounded-lg border cursor-pointer transition-all
                                        ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-primary/50 hover:bg-secondary/50'}
                                        ${isToday ? 'ring-2 ring-primary/30' : ''}
                                        ${dateHasBookings ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-500 ring-1 ring-emerald-500/20' : ''}
                                    `}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                                            {format(date, 'd')}
                                        </div>
                                        {dateHasBookings && (
                                            <div className="mt-auto space-y-1">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    ${revenue.toFixed(0)}
                                                </div>
                                                <div className="flex gap-1">
                                                    {getBookingsForDate(date).slice(0, 3).map((_, i) => (
                                                        <div key={i} className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Date Details */}
            {selectedDate && (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Bookings for {format(selectedDate, 'MMMM d, yyyy')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDateBookings.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDateBookings.map((booking) => {
                                    const checkIn = new Date(booking.check_in);
                                    const checkOut = new Date(booking.check_out);
                                    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                                    const pricePerNight = Number(booking.total_paid || 0) / nights;

                                    return (
                                        <div
                                            key={booking.id}
                                            className="p-4 border rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold">{booking.guest_name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {booking.property_name} - Room {booking.room_type}
                                                    </p>
                                                </div>
                                                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm bg-background/50 p-3 rounded-md">
                                                <div>
                                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Check-in</span>
                                                    <span className="font-medium">{format(checkIn, 'EEE, MMM d, yyyy')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Check-out</span>
                                                    <span className="font-medium">{format(checkOut, 'EEE, MMM d, yyyy')}</span>
                                                </div>
                                                <div className="col-span-2 border-t pt-2 mt-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Avg. Nightly Rate (Room + Extras):</span>
                                                        <span className="font-medium text-emerald-600">
                                                            ${pricePerNight.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground font-medium">Total Paid:</span>
                                                        <span className="text-lg font-bold">
                                                            ${Number(booking.total_paid || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-3 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Total Revenue for this day:</span>
                                        <span className="text-xl font-bold text-emerald-600">
                                            ${getTotalRevenue(selectedDate).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No bookings for this date</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
