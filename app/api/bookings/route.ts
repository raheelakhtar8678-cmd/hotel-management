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
            // Fetch all bookings
            const { rows } = await sql`
                SELECT b.*, r.type as room_type, r.property_id, p.name as property_name
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                JOIN properties p ON r.property_id = p.id
                ORDER BY b.created_at DESC
            `;
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
            channel
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
                guests, total_paid, status, channel
            ) VALUES (
                ${room_id}, ${guest_name}, ${guest_email || null}, ${check_in}, ${check_out},
                ${guests || 1}, ${total_price || 0}, ${status || 'confirmed'}, ${channel || 'direct'}
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
