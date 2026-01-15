import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Users, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { CalendarSyncWidget } from "@/components/calendar-sync-widget";
import { Button } from "@/components/ui/button";
import { adminClient } from "@/lib/supabase/admin";

export const revalidate = 0;

export default async function CalendarPage() {
    let bookings: any[] = [];
    let upcomingCount = 0;
    let activeCount = 0;

    try {
        const { data, error } = await adminClient
            .from('bookings')
            .select('*, rooms(*, properties(name))')
            .order('check_in', { ascending: true });

        if (!error && data) {
            bookings = data;
            const today = new Date().toISOString().split('T')[0];
            upcomingCount = bookings.filter(b => b.check_in > today).length;
            activeCount = bookings.filter(b => b.check_in <= today && b.check_out > today && b.status === 'confirmed').length;
        }
    } catch (err) {
        console.warn("Using mock bookings data");
        bookings = [
            {
                id: '1',
                check_in: '2026-01-20',
                check_out: '2026-01-25',
                status: 'confirmed',
                total_paid: 750,
                rooms: { properties: { name: 'Grand Hotel' } }
            },
            {
                id: '2',
                check_in: '2026-01-22',
                check_out: '2026-01-24',
                status: 'confirmed',
                total_paid: 400,
                rooms: { properties: { name: 'Beach Villa' } }
            }
        ];
        upcomingCount = 2;
        activeCount = 0;
    }

    return (
        <div className="flex-1 p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">
                        Calendar & Bookings
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage reservations and availability
                    </p>
                </div>
                <Link href="/calendar/new">
                    <Button className="bg-gradient-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        New Booking
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <CalendarIcon className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bookings.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">Currently checked in</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover-glow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                        <Clock className="h-5 w-5 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingCount}</div>
                        <p className="text-xs text-muted-foreground">Future reservations</p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Sync Widget */}
            <div id="calendar-sync-widget" className="mb-8">
                <CalendarSyncWidget />
            </div>

            {/* Bookings List */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {bookings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                            <p className="mb-6">Start accepting reservations to see them here</p>
                            <Button className="bg-gradient-primary">
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Booking
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bookings.map((booking) => {
                                const checkIn = new Date(booking.check_in);
                                const checkOut = new Date(booking.check_out);
                                const today = new Date();
                                const isActive = checkIn <= today && checkOut > today;
                                const isUpcoming = checkIn > today;

                                return (
                                    <div
                                        key={booking.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-lg">
                                                <CalendarIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold">
                                                        {booking.rooms?.properties?.name || 'Property'}
                                                    </p>
                                                    {isActive && (
                                                        <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                                                            Active
                                                        </Badge>
                                                    )}
                                                    {isUpcoming && (
                                                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-500">
                                                            Upcoming
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-emerald-500">
                                                ${booking.total_paid?.toLocaleString()}
                                            </p>
                                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Calendar Sync Card */}
            <Card className="glass-card mt-6">
                <CardHeader>
                    <CardTitle>Calendar Sync</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-secondary/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                            📅 Connect your Airbnb, Vrbo, or Booking.com calendars to automatically import reservations
                        </p>
                        <Link href="/settings">
                            <Button variant="outline" className="w-full" size="sm">
                                Configure Calendar Sync
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
