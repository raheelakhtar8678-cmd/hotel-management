
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Check if POSTGRES_URL env var exists (injected by Vercel)
    const connected = !!process.env.POSTGRES_URL;
    return NextResponse.json({ connected });
}
