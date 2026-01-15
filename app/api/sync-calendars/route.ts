import { adminClient } from '@/lib/supabase/admin';
import { ICalParser } from '@/lib/ical/parser';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Sync iCal calendars and import bookings
 * Triggered manually or via cron
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { connection_id } = body;

        let connections = [];

        if (connection_id) {
            // Sync specific connection
            const { data, error } = await adminClient
                .from('calendar_connections')
                .select('*')
                .eq('id', connection_id)
                .eq('is_active', true)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'Connection not found' },
                    { status: 404 }
                );
            }

            connections = [data];
        } else {
            // Sync all active connections
            const { data, error } = await adminClient
                .from('calendar_connections')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            connections = data || [];
        }

        let totalImported = 0;
        let totalConflicts = 0;
        const results = [];

        for (const connection of connections) {
            try {
                // Mark sync as in progress
                await adminClient
                    .from('calendar_connections')
                    .update({ sync_status: 'syncing' })
                    .eq('id', connection.id);

                // Parse iCal feed
                const events = await ICalParser.parseFromUrl(connection.ical_url);

                // Fetch existing bookings for conflict detection
                const { data: existingBookings } = await adminClient
                    .from('bookings')
                    .select('check_in, check_out, external_id')
                    .eq('property_id', connection.property_id);

                let imported = 0;
                let conflicts = 0;

                for (const event of events) {
                    // Skip cancelled events
                    if (event.status === 'cancelled') continue;

                    // Check if already imported
                    const isExisting = existingBookings?.some(
                        b => b.external_id === event.uid
                    );

                    if (isExisting) continue;

                    // Check for conflicts
                    if (ICalParser.hasConflict(event, existingBookings || [])) {
                        conflicts++;
                        console.warn(`Conflict detected for event: ${event.uid}`);
                        continue;
                    }

                    // Determine room_id
                    const roomId = connection.room_id || await getDefaultRoom(connection.property_id);

                    if (!roomId) {
                        console.warn(`No room available for property ${connection.property_id}`);
                        continue;
                    }

                    // Calculate nights and price
                    const checkIn = new Date(event.startDate);
                    const checkOut = new Date(event.endDate);
                    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

                    // Get room price
                    const { data: room } = await adminClient
                        .from('rooms')
                        .select('current_price')
                        .eq('id', roomId)
                        .single();

                    const totalPaid = (room?.current_price || 100) * nights;

                    // Import booking
                    const { error: bookingError } = await adminClient
                        .from('bookings')
                        .insert({
                            room_id: roomId,
                            property_id: connection.property_id,
                            guest_name: event.summary || 'iCal Import',
                            check_in: event.startDate,
                            check_out: event.endDate,
                            guests: 1,
                            total_paid: totalPaid,
                            status: event.status,
                            channel: connection.platform || 'other',
                            external_id: event.uid,
                            notes: event.description
                        });

                    if (!bookingError) {
                        imported++;
                        totalImported++;
                    }
                }

                totalConflicts += conflicts;

                // Update sync status
                await adminClient
                    .from('calendar_connections')
                    .update({
                        sync_status: 'success',
                        last_sync_at: new Date().toISOString(),
                        last_sync_count: imported
                    })
                    .eq('id', connection.id);

                results.push({
                    connection_id: connection.id,
                    connection_name: connection.name,
                    imported,
                    conflicts,
                    total_events: events.length
                });

            } catch (syncError) {
                console.error(`Sync error for connection ${connection.id}:`, syncError);

                await adminClient
                    .from('calendar_connections')
                    .update({
                        sync_status: 'error',
                        last_error: syncError instanceof Error ? syncError.message : 'Unknown error'
                    })
                    .eq('id', connection.id);

                results.push({
                    connection_id: connection.id,
                    connection_name: connection.name,
                    error: syncError instanceof Error ? syncError.message : 'Sync failed'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${connections.length} calendar(s)`,
            totalImported,
            totalConflicts,
            results
        });

    } catch (error) {
        console.error('Calendar sync error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to sync calendars' },
            { status: 500 }
        );
    }
}

/**
 * Helper: Get default room for property
 */
async function getDefaultRoom(propertyId: string): Promise<string | null> {
    const { data: rooms } = await adminClient
        .from('rooms')
        .select('id')
        .eq('property_id', propertyId)
        .eq('status', 'available')
        .limit(1);

    return rooms?.[0]?.id || null;
}
