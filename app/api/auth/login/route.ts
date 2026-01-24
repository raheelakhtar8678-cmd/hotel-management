import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Admin Login API
 * Validates password against ADMIN_PASSWORD env variable
 * Sets HTTP-only cookie on success
 */

const AUTH_COOKIE_NAME = 'yv_admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        // Get admin password from env
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            // If no password set, allow access (for initial setup)
            console.warn('ADMIN_PASSWORD not set - allowing access');
        } else if (password !== adminPassword) {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            );
        }

        // Generate session token
        const sessionToken = generateSessionToken();

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_DURATION / 1000, // in seconds
            path: '/'
        });

        return NextResponse.json({
            success: true,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
