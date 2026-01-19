import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch rooms by property_id (optional)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const property_id = searchParams.get('property_id');

        let query;
        if (property_id) {
            query = sql`
                SELECT * FROM rooms 
                WHERE property_id = ${property_id}
                ORDER BY created_at DESC
            `;
        } else {
            // Return all rooms if no property_id specified
            query = sql`
                SELECT * FROM rooms 
                ORDER BY created_at DESC
            `;
        }

        const { rows } = await query;

        return NextResponse.json({
            success: true,
            rooms: rows || []
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch rooms' },
            { status: 500 }
        );
    }
}

// POST: Create new room
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { property_id, type, status, name, current_price, amenities, images } = body;

        if (!property_id) {
            return NextResponse.json(
                { success: false, error: 'Property ID is required' },
                { status: 400 }
            );
        }

        // Get property to inherit base price if custom price not provided
        const { rows: propertyRows } = await sql`
            SELECT base_price FROM properties WHERE id = ${property_id} LIMIT 1
        `;
        const property = propertyRows[0];

        // Use provided price, or fall back to property base price
        const finalPrice = current_price || property?.base_price || 100;

        // Convert arrays to JSON strings for storage
        const amenitiesJson = amenities ? JSON.stringify(amenities) : null;
        const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;

        const { rows } = await sql`
            INSERT INTO rooms (
                property_id, type, status, current_price, last_logic_reason, name, amenities, images
            ) VALUES (
                ${property_id},
                ${type || 'Standard'},
                ${status || 'available'},
                ${finalPrice},
                'Initial setup',
                ${name || ('Room ' + Date.now().toString().slice(-4))},
                ${amenitiesJson},
                ${imagesJson}
            )
            RETURNING *
        `;

        const room = rows[0];

        return NextResponse.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create room' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a room by ID
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Room ID is required' },
                { status: 400 }
            );
        }

        // First delete any extras associated with this room
        await sql`DELETE FROM room_extras WHERE room_id = ${id}`;

        // Then delete the room
        await sql`DELETE FROM rooms WHERE id = ${id}`;

        return NextResponse.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete room' },
            { status: 500 }
        );
    }
}

// PATCH: Update room status
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Room ID is required' },
                { status: 400 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { success: false, error: 'Status is required' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            UPDATE rooms 
            SET status = ${status}
            WHERE id = ${id}
            RETURNING *
        `;

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            room: rows[0]
        });
    } catch (error) {
        console.error('Error updating room status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update room status' },
            { status: 500 }
        );
    }
}
