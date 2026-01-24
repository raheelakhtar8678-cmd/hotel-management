import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for admin route protection
 * 
 * Public routes (no auth required):
 * - /login
 * - /book/* (public booking pages)
 * - /api/webhooks/* (external integrations)
 * - /api/public/* (public APIs)
 * - /api/auth/* (login/logout)
 * 
 * Protected routes (auth required):
 * - Everything else (dashboard, bookings, settings, etc.)
 */

const AUTH_COOKIE_NAME = 'yv_admin_session';

// Routes that don't require authentication
const publicRoutes = [
    '/login',
    '/book',
    '/api/webhooks',
    '/api/public',
    '/api/auth',
];

// Static assets and Next.js internals
const staticPaths = [
    '/_next',
    '/favicon.ico',
    '/images',
    '/fonts',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static assets
    if (staticPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check if this is a public route
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Check for auth cookie
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    // Check if ADMIN_PASSWORD is set (if not, skip auth for initial setup)
    const adminPasswordSet = process.env.ADMIN_PASSWORD;

    if (!adminPasswordSet) {
        // No password configured - allow access (initial setup mode)
        return NextResponse.next();
    }

    if (!authCookie) {
        // Not authenticated - redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated - allow access
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
