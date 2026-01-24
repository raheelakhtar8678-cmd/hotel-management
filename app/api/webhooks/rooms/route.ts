import { NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';
import {
    validateApiKey,
    hasPermission,
    unauthorizedResponse,
    forbiddenResponse,
    successResponse,
    handleCorsPreFlight,
    corsHeaders
} from '@/lib/api-auth';

/**
 * Webhook API: Rooms
 * 
 * GET /api/webhooks/rooms - List all rooms with their current status
 */

export async function OPTIONS() {
    return handleCorsPreFlight();
}

export async function GET(request: NextRequest) {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return unauthorizedResponse(auth.error);
    }

    if (!hasPermission(auth, 'read')) {
        return forbiddenResponse('API key does not have read permission');
    }

    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('property_id');
        const includeInactive = searchParams.get('include_inactive') === 'true';

        let query = `
            SELECT 
                r.id,
                r.name,
                r.room_type,
                r.base_price,
                r.max_guests,
                r.amenities,
                r.is_active,
                r.created_at,
                p.id as property_id,
                p.name as property_name,
                p.city,
                p.country
            FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (!includeInactive) {
            query += ` AND r.is_active = true`;
        }

        if (propertyId) {
            query += ` AND p.id = $${paramIndex}`;
            params.push(propertyId);
            paramIndex++;
        }

        query += ' ORDER BY p.name, r.name';

        const { rows } = await sql.query(query, params);

        // Get today's date for occupancy check
        const today = new Date().toISOString().split('T')[0];

        // Check current occupancy for each room
        const roomsWithStatus = await Promise.all(rows.map(async (room) => {
            const currentBooking = await sql`
                SELECT id, guest_name, check_in, check_out
                FROM bookings 
                WHERE room_id = ${room.id}
                AND status = 'confirmed'
                AND check_in <= ${today}
                AND check_out > ${today}
                LIMIT 1
            `;

            const isOccupied = currentBooking.rows.length > 0;

            return {
                id: room.id,
                name: room.name || room.room_type,
                room_type: room.room_type,
                base_price: room.base_price,
                max_guests: room.max_guests,
                amenities: room.amenities,
                is_active: room.is_active,
                property: {
                    id: room.property_id,
                    name: room.property_name,
                    city: room.city,
                    country: room.country
                },
                status: {
                    is_occupied: isOccupied,
                    current_guest: isOccupied ? currentBooking.rows[0].guest_name : null,
                    current_booking: isOccupied ? {
                        id: currentBooking.rows[0].id,
                        check_in: currentBooking.rows[0].check_in,
                        check_out: currentBooking.rows[0].check_out
                    } : null
                }
            };
        }));

        // Group by property
        const byProperty: Record<string, any> = {};
        roomsWithStatus.forEach(room => {
            if (!byProperty[room.property.id]) {
                byProperty[room.property.id] = {
                    property: room.property,
                    rooms: [],
                    summary: { total: 0, occupied: 0, available: 0 }
                };
            }
            byProperty[room.property.id].rooms.push(room);
            byProperty[room.property.id].summary.total++;
            if (room.status.is_occupied) {
                byProperty[room.property.id].summary.occupied++;
            } else {
                byProperty[room.property.id].summary.available++;
            }
        });

        return successResponse({
            total_rooms: roomsWithStatus.length,
            occupied: roomsWithStatus.filter(r => r.status.is_occupied).length,
            available: roomsWithStatus.filter(r => !r.status.is_occupied).length,
            rooms: roomsWithStatus,
            by_property: Object.values(byProperty)
        });

    } catch (error) {
        console.error('Webhook rooms error:', error);
        return Response.json(
            { success: false, error: 'Failed to fetch rooms' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
