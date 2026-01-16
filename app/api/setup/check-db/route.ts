
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Check if POSTGRES_URL env var exists (injected by Vercel)
    // Or if DATABASE_URL exists (Neon integration)
    const hasPostgres = !!process.env.POSTGRES_URL;
    const hasDatabase = !!process.env.DATABASE_URL;

    // Polyfill for @vercel/postgres if using Neon integration
    if (!hasPostgres && hasDatabase) {
        process.env.POSTGRES_URL = process.env.DATABASE_URL;
    }

    return NextResponse.json({
        connected: hasPostgres || hasDatabase,
        provider: hasPostgres ? 'vercel-postgres' : 'neon'
    });
}
