import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ical_url TEXT;`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS external_id TEXT;`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bookings_external_id ON bookings(external_id);`;

        return NextResponse.json({ success: true, message: 'iCal columns added successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
