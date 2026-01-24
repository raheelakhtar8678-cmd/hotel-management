import { NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';
import {
    validateApiKey,
    hasPermission,
    unauthorizedResponse,
    forbiddenResponse,
    badRequestResponse,
    successResponse,
    handleCorsPreFlight,
    corsHeaders
} from '@/lib/api-auth';

/**
 * Webhook API: Availability Check
 * 
 * GET /api/webhooks/availability?room_id=xxx&check_in=2024-01-01&check_out=2024-01-05
 * 
 * Returns availability status and pricing for specified dates
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
        const roomId = searchParams.get('room_id');
        const propertyId = searchParams.get('property_id');
        const checkIn = searchParams.get('check_in');
        const checkOut = searchParams.get('check_out');

        // Validate required parameters
        if (!checkIn) return badRequestResponse('check_in date is required (YYYY-MM-DD)');
        if (!checkOut) return badRequestResponse('check_out date is required (YYYY-MM-DD)');

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (isNaN(checkInDate.getTime())) return badRequestResponse('Invalid check_in date');
        if (isNaN(checkOutDate.getTime())) return badRequestResponse('Invalid check_out date');
        if (checkOutDate <= checkInDate) return badRequestResponse('check_out must be after check_in');

        // Calculate nights
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        // Build query for rooms
        let roomQuery = `
            SELECT 
                r.id,
                r.name as room_name,
                r.room_type,
                r.base_price,
                r.max_guests,
                p.id as property_id,
                p.name as property_name,
                p.base_price as property_base_price
            FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE r.is_active = true
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (roomId) {
            roomQuery += ` AND r.id = $${paramIndex}`;
            params.push(roomId);
            paramIndex++;
        }

        if (propertyId) {
            roomQuery += ` AND p.id = $${paramIndex}`;
            params.push(propertyId);
            paramIndex++;
        }

        roomQuery += ' ORDER BY p.name, r.name';

        const { rows: rooms } = await sql.query(roomQuery, params);

        // Check availability for each room
        const availabilityResults = await Promise.all(rooms.map(async (room) => {
            // Check for conflicting bookings
            const conflicts = await sql`
                SELECT id, check_in, check_out, guest_name
                FROM bookings 
                WHERE room_id = ${room.id}
                AND status = 'confirmed'
                AND (
                    (check_in <= ${checkIn} AND check_out > ${checkIn})
                    OR (check_in < ${checkOut} AND check_out >= ${checkOut})
                    OR (check_in >= ${checkIn} AND check_out <= ${checkOut})
                )
            `;

            const isAvailable = conflicts.rows.length === 0;
            const basePrice = room.base_price || room.property_base_price || 100;
            const estimatedTotal = basePrice * nights;

            return {
                room_id: room.id,
                room_name: room.room_name || room.room_type,
                room_type: room.room_type,
                property_id: room.property_id,
                property_name: room.property_name,
                max_guests: room.max_guests,
                is_available: isAvailable,
                conflicts: isAvailable ? [] : conflicts.rows.map(c => ({
                    booking_id: c.id,
                    check_in: c.check_in,
                    check_out: c.check_out,
                    guest_name: c.guest_name
                })),
                pricing: {
                    base_price_per_night: basePrice,
                    nights: nights,
                    estimated_total: estimatedTotal,
                    currency: 'USD'
                }
            };
        }));

        // Summary
        const availableRooms = availabilityResults.filter(r => r.is_available);
        const unavailableRooms = availabilityResults.filter(r => !r.is_available);

        return successResponse({
            query: {
                check_in: checkIn,
                check_out: checkOut,
                nights: nights,
                room_id: roomId || null,
                property_id: propertyId || null
            },
            summary: {
                total_rooms: availabilityResults.length,
                available: availableRooms.length,
                unavailable: unavailableRooms.length
            },
            rooms: availabilityResults
        });

    } catch (error) {
        console.error('Webhook availability error:', error);
        return Response.json(
            { success: false, error: 'Failed to check availability' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
