import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await sql`SELECT ical_url FROM rooms LIMIT 1`;
        return NextResponse.json({ success: true, message: 'Column exists' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
