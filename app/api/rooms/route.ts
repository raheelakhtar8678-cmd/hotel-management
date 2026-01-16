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
        const { property_id, type, status } = body;

        if (!property_id) {
            return NextResponse.json(
                { success: false, error: 'Property ID is required' },
                { status: 400 }
            );
        }

        // Get property to inherit base price
        const { rows: propertyRows } = await sql`
            SELECT base_price FROM properties WHERE id = ${property_id} LIMIT 1
        `;
        const property = propertyRows[0];

        const { rows } = await sql`
            INSERT INTO rooms (
                property_id, type, status, current_price, last_logic_reason
            ) VALUES (
                ${property_id},
                ${type || 'Standard'},
                ${status || 'available'},
                ${property?.base_price || 100},
                'Initial setup'
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
