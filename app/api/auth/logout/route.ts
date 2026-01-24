import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Admin Logout API
 * Clears the auth cookie
 */

const AUTH_COOKIE_NAME = 'yv_admin_session';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
    });
}

// Also allow GET for convenience
export async function GET() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}
