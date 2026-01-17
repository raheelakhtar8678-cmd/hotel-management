import { syncRoomIcal } from '@/app/lib/ical-sync';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const roomId = params.id;

        // Get URL from DB
        const { rows } = await sql`SELECT ical_url FROM rooms WHERE id = ${roomId}`;

        if (!rows.length || !rows[0].ical_url) {
            return NextResponse.json({ success: false, error: 'No iCal URL configured for this room' }, { status: 400 });
        }

        // Sync
        const result = await syncRoomIcal(roomId, rows[0].ical_url);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
