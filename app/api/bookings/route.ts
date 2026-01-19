import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch bookings
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const room_id = searchParams.get('room_id');

        if (id) {
            // Fetch single booking with room and property details
            const { rows } = await sql`
                SELECT b.*, r.type as room_type, r.property_id, p.name as property_name, p.address
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                JOIN properties p ON r.property_id = p.id
                WHERE b.id = ${id}
                LIMIT 1
            `;
            return NextResponse.json({
                success: true,
                booking: rows[0] || null
            });
        } else if (room_id) {
            // Fetch bookings for a specific room
            const { rows } = await sql`
                SELECT * FROM bookings WHERE room_id = ${room_id} ORDER BY check_in DESC
            `;
            return NextResponse.json({
                success: true,
                bookings: rows || []
            });
        } else {
            // Fetch all bookings (optionally filtered by property)
            const property_id = searchParams.get('property_id');
            let query;

            if (property_id && property_id !== 'all') {
                query = sql`
                    SELECT b.*, r.type as room_type, r.property_id, p.name as property_name
                    FROM bookings b
                    JOIN rooms r ON b.room_id = r.id
                    JOIN properties p ON r.property_id = p.id
                    WHERE r.property_id = ${property_id}
                    ORDER BY b.created_at DESC
                `;
            } else {
                query = sql`
                    SELECT b.*, r.type as room_type, r.property_id, p.name as property_name
                    FROM bookings b
                    JOIN rooms r ON b.room_id = r.id
                    JOIN properties p ON r.property_id = p.id
                    ORDER BY b.created_at DESC
                `;
            }

            const { rows } = await query;
            return NextResponse.json({
                success: true,
                bookings: rows || []
            });
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch bookings' },
            { status: 500 }
        );
    }
}

// POST: Create new booking
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            room_id,
            guest_name,
            guest_email,
            check_in,
            check_out,
            guests,
            total_price,
            status,
            channel,
            taxes_applied,
            tax_total
        } = body;

        if (!room_id || !guest_name || !check_in || !check_out) {
            return NextResponse.json(
                { success: false, error: 'Room, guest name, check-in, and check-out are required' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            INSERT INTO bookings (
                room_id, guest_name, guest_email, check_in, check_out,
                guests, total_paid, status, channel, taxes_applied, tax_total
            ) VALUES (
                ${room_id}, ${guest_name}, ${guest_email || null}, ${check_in}, ${check_out},
                ${guests || 1}, ${total_price || 0}, ${status || 'confirmed'}, ${channel || 'direct'},
                ${taxes_applied || null}, ${tax_total || 0}
            )
            RETURNING *
        `;

        const booking = rows[0];

        // Update room status to occupied
        await sql`UPDATE rooms SET status = 'occupied' WHERE id = ${room_id}`;

        return NextResponse.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}

// PATCH: Process refund for a booking
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { booking_id, refund_amount, refund_reason } = body;

        if (!booking_id || refund_amount === undefined) {
            return NextResponse.json(
                { success: false, error: 'Booking ID and refund amount are required' },
                { status: 400 }
            );
        }

        // Get the booking first
        const { rows: existingBooking } = await sql`
            SELECT * FROM bookings WHERE id = ${booking_id} LIMIT 1
        `;

        if (!existingBooking[0]) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Update booking with refund info
        const { rows } = await sql`
            UPDATE bookings 
            SET refund_amount = ${refund_amount},
                refund_reason = ${refund_reason || null},
                refunded_at = NOW(),
                status = 'refunded'
            WHERE id = ${booking_id}
            RETURNING *
        `;

        const booking = rows[0];

        // Set room back to available
        await sql`UPDATE rooms SET status = 'available' WHERE id = ${booking.room_id}`;

        return NextResponse.json({
            success: true,
            booking,
            message: `Refund of $${refund_amount} processed successfully`
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to process refund' },
            { status: 500 }
        );
    }
}
