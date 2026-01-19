import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET /api/taxes?property_id=xxx - Get all taxes for a property
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('property_id');

        if (!propertyId) {
            return NextResponse.json(
                { success: false, error: 'Property ID is required' },
                { status: 400 }
            );
        }

        const { rows: taxes } = await sql`
            SELECT * FROM taxes 
            WHERE property_id = ${propertyId} AND is_active = true
            ORDER BY name
        `;

        return NextResponse.json({
            success: true,
            taxes
        });
    } catch (error) {
        console.error('Error fetching taxes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch taxes' },
            { status: 500 }
        );
    }
}

// POST /api/taxes - Create a new tax
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { property_id, name, type, value, applies_to } = body;

        if (!property_id || !name || !type || value === undefined || !applies_to) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            INSERT INTO taxes (property_id, name, type, value, applies_to)
            VALUES (${property_id}, ${name}, ${type}, ${value}, ${applies_to})
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            tax: rows[0]
        });
    } catch (error) {
        console.error('Error creating tax:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create tax' },
            { status: 500 }
        );
    }
}

// DELETE /api/taxes - Delete a tax
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Tax ID is required' },
                { status: 400 }
            );
        }

        await sql`DELETE FROM taxes WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting tax:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete tax' },
            { status: 500 }
        );
    }
}
