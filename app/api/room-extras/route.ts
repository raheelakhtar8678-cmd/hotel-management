import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch room extras
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const room_id = searchParams.get('room_id');
        const booking_id = searchParams.get('booking_id');
        const property_id = searchParams.get('property_id');

        let query;

        if (room_id) {
            query = sql`SELECT * FROM room_extras WHERE room_id = ${room_id} ORDER BY created_at DESC`;
        } else if (booking_id) {
            query = sql`SELECT * FROM room_extras WHERE booking_id = ${booking_id} ORDER BY created_at DESC`;
        } else if (property_id) {
            // Get extras for all rooms in a property
            query = sql`
                SELECT re.*, r.type as room_type, r.property_id
                FROM room_extras re
                JOIN rooms r ON re.room_id = r.id
                WHERE r.property_id = ${property_id}
                ORDER BY re.created_at DESC
            `;
        } else {
            // Get all extras
            query = sql`
                SELECT re.*, r.type as room_type, r.property_id
                FROM room_extras re
                JOIN rooms r ON re.room_id = r.id
                ORDER BY re.created_at DESC
            `;
        }

        const { rows } = await query;

        return NextResponse.json({
            success: true,
            extras: rows || []
        });
    } catch (error) {
        console.error('Error fetching room extras:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch room extras' },
            { status: 500 }
        );
    }
}

// POST: Add new room extra
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            room_id,
            booking_id,
            item_name,
            item_category,
            price,
            quantity,
            description
        } = body;

        if (!room_id || !item_name || !price) {
            return NextResponse.json(
                { success: false, error: 'Room ID, item name, and price are required' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            INSERT INTO room_extras (
                room_id, booking_id, item_name, item_category, 
                price, quantity, description, status
            ) VALUES (
                ${room_id}, ${booking_id || null}, ${item_name}, ${item_category || 'other'},
                ${price}, ${quantity || 1}, ${description || null}, 'pending'
            )
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            extra: rows[0]
        });
    } catch (error) {
        console.error('Error creating room extra:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create room extra' },
            { status: 500 }
        );
    }
}

// PATCH: Update room extra
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, price, quantity, status } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Extra ID is required' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            UPDATE room_extras SET
                price = COALESCE(${price}, price),
                quantity = COALESCE(${quantity}, quantity),
                status = COALESCE(${status}, status)
            WHERE id = ${id}
            RETURNING *
        `;

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Extra not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            extra: rows[0]
        });
    } catch (error) {
        console.error('Error updating room extra:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update room extra' },
            { status: 500 }
        );
    }
}

// DELETE: Remove room extra
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Extra ID is required' },
                { status: 400 }
            );
        }

        await sql`DELETE FROM room_extras WHERE id = ${id}`;

        return NextResponse.json({
            success: true,
            message: 'Extra deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting room extra:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete room extra' },
            { status: 500 }
        );
    }
}
