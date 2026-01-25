import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API to get guest booking history
 * Searches by email address
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Get all bookings for this email
        const { rows: bookings } = await sql`
            SELECT 
                b.id,
                b.check_in,
                b.check_out,
                b.guests,
                b.total_amount,
                b.status,
                b.payment_status,
                b.created_at,
                r.name as room_name,
                r.image_url as room_image,
                p.name as property_name,
                p.city as property_city,
                p.country as property_country,
                p.currency
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN properties p ON b.property_id = p.id
            WHERE LOWER(b.guest_email) = LOWER(${email})
            ORDER BY b.created_at DESC
        `;

        return NextResponse.json({
            success: true,
            bookings: bookings.map(b => ({
                id: b.id,
                checkIn: b.check_in,
                checkOut: b.check_out,
                guests: b.guests,
                totalAmount: Number(b.total_amount),
                status: b.status,
                paymentStatus: b.payment_status,
                createdAt: b.created_at,
                room: {
                    name: b.room_name,
                    imageUrl: b.room_image
                },
                property: {
                    name: b.property_name,
                    city: b.property_city,
                    country: b.property_country,
                    currency: b.currency || 'USD'
                }
            }))
        });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load bookings' },
            { status: 500 }
        );
    }
}
