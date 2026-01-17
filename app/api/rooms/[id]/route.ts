import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await request.json();
        const { ical_url, name, current_price, type, status } = body;
        const { id } = await params;
        const roomId = id;

        // Verify room exists
        const { rows: check } = await sql`SELECT id FROM rooms WHERE id = ${roomId}`;
        if (check.length === 0) {
            return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        // Perform updates
        if (ical_url !== undefined) {
            await sql`UPDATE rooms SET ical_url = ${ical_url} WHERE id = ${roomId}`;
        }
        if (name !== undefined) {
            await sql`UPDATE rooms SET name = ${name} WHERE id = ${roomId}`;
        }
        if (current_price !== undefined) {
            await sql`UPDATE rooms SET current_price = ${current_price} WHERE id = ${roomId}`;
        }
        if (type !== undefined) {
            await sql`UPDATE rooms SET type = ${type} WHERE id = ${roomId}`;
        }
        if (status !== undefined) {
            await sql`UPDATE rooms SET status = ${status} WHERE id = ${roomId}`;
        }

        return NextResponse.json({ success: true, message: 'Room updated' });
    } catch (error: any) {
        console.error('Error updating room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
