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
 * Webhook API: Bookings
 * 
 * GET /api/webhooks/booking - List recent bookings
 * POST /api/webhooks/booking - Create a new booking
 * 
 * Authentication: API Key via Authorization header or X-API-Key
 */

// Handle CORS preflight
export async function OPTIONS() {
    return handleCorsPreFlight();
}

// GET - List recent bookings
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
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');
        const status = searchParams.get('status');
        const propertyId = searchParams.get('property_id');

        // Build query
        let query = `
            SELECT 
                b.id,
                b.guest_name,
                b.guest_email,
                b.check_in,
                b.check_out,
                b.total_paid,
                b.status,
                b.channel,
                b.guests,
                b.created_at,
                r.room_type,
                r.name as room_name,
                p.name as property_name,
                p.id as property_id
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN properties p ON r.property_id = p.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND b.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (propertyId) {
            query += ` AND p.id = $${paramIndex}`;
            params.push(propertyId);
            paramIndex++;
        }

        query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const { rows } = await sql.query(query, params);

        // Get total count
        const countResult = await sql`SELECT COUNT(*) as total FROM bookings`;
        const total = parseInt(countResult.rows[0].total);

        return successResponse({
            bookings: rows,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + rows.length < total
            }
        });

    } catch (error) {
        console.error('Webhook GET bookings error:', error);
        return Response.json(
            { success: false, error: 'Failed to fetch bookings' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST - Create a new booking
export async function POST(request: NextRequest) {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return unauthorizedResponse(auth.error);
    }

    if (!hasPermission(auth, 'write')) {
        return forbiddenResponse('API key does not have write permission');
    }

    try {
        const body = await request.json();

        // Validate required fields
        const { room_id, guest_name, check_in, check_out, total_paid } = body;

        if (!room_id) return badRequestResponse('room_id is required');
        if (!guest_name) return badRequestResponse('guest_name is required');
        if (!check_in) return badRequestResponse('check_in is required');
        if (!check_out) return badRequestResponse('check_out is required');
        if (total_paid === undefined) return badRequestResponse('total_paid is required');

        // Validate dates
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        if (isNaN(checkInDate.getTime())) return badRequestResponse('Invalid check_in date');
        if (isNaN(checkOutDate.getTime())) return badRequestResponse('Invalid check_out date');
        if (checkOutDate <= checkInDate) return badRequestResponse('check_out must be after check_in');

        // Optional fields with defaults
        const guest_email = body.guest_email || null;
        const status = body.status || 'confirmed';
        const channel = body.channel || 'webhook';
        const guests = body.guests || 1;
        const notes = body.notes || null;

        // Check room exists
        const roomCheck = await sql`SELECT id FROM rooms WHERE id = ${room_id}`;
        if (roomCheck.rows.length === 0) {
            return badRequestResponse('Room not found');
        }

        // Check for overlapping bookings
        const overlap = await sql`
            SELECT id FROM bookings 
            WHERE room_id = ${room_id}
            AND status = 'confirmed'
            AND (
                (check_in <= ${check_in} AND check_out > ${check_in})
                OR (check_in < ${check_out} AND check_out >= ${check_out})
                OR (check_in >= ${check_in} AND check_out <= ${check_out})
            )
        `;

        if (overlap.rows.length > 0) {
            return badRequestResponse('Room is already booked for these dates');
        }

        // Create booking
        const { rows } = await sql`
            INSERT INTO bookings (
                room_id, guest_name, guest_email, check_in, check_out, 
                total_paid, status, channel, guests, notes
            ) VALUES (
                ${room_id}, ${guest_name}, ${guest_email}, ${check_in}, ${check_out},
                ${total_paid}, ${status}, ${channel}, ${guests}, ${notes}
            )
            RETURNING *
        `;

        return Response.json(
            { success: true, booking: rows[0], message: 'Booking created successfully' },
            { status: 201, headers: corsHeaders() }
        );

    } catch (error) {
        console.error('Webhook POST booking error:', error);
        return Response.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
