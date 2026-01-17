import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const property_id = searchParams.get('property_id');

        let query;
        if (property_id && property_id !== 'all') {
            query = sql`
                SELECT s.*, p.name as property_name, r.type as room_type, r.name as room_name
                FROM staff s
                LEFT JOIN properties p ON s.property_id = p.id
                LEFT JOIN rooms r ON s.assigned_room_id = r.id
                WHERE s.property_id = ${property_id}
                ORDER BY s.created_at DESC
            `;
        } else {
            query = sql`
                SELECT s.*, p.name as property_name, r.type as room_type, r.name as room_name
                FROM staff s
                LEFT JOIN properties p ON s.property_id = p.id
                LEFT JOIN rooms r ON s.assigned_room_id = r.id
                ORDER BY s.created_at DESC
            `;
        }

        const { rows } = await query;
        return NextResponse.json({ success: true, staff: rows });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch staff' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            property_id,
            assigned_room_id,
            work_start_time,
            work_end_time,
            contact_phone,
            contact_email,
            emergency_contact_name,
            emergency_contact_phone
        } = body;

        if (!name || !property_id) {
            return NextResponse.json(
                { success: false, error: 'Name and Property are required' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            INSERT INTO staff (
                name,
                property_id,
                assigned_room_id,
                work_start_time,
                work_end_time,
                contact_phone,
                contact_email,
                emergency_contact_name,
                emergency_contact_phone,
                status
            ) VALUES (
                ${name},
                ${property_id},
                ${assigned_room_id || null},
                ${work_start_time || null},
                ${work_end_time || null},
                ${contact_phone || null},
                ${contact_email || null},
                ${emergency_contact_name || null},
                ${emergency_contact_phone || null},
                'active'
            ) RETURNING *
        `;

        return NextResponse.json({ success: true, staff: rows[0] });
    } catch (error) {
        console.error('Error adding staff:', error);
        return NextResponse.json({ success: false, error: 'Failed to add staff' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        await sql`DELETE FROM staff WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting staff:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete staff' }, { status: 500 });
    }
}
