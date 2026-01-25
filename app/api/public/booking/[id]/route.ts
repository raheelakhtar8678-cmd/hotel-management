import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API to get a single booking by ID
 * For confirmation/receipt page
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Booking ID is required' },
                { status: 400 }
            );
        }

        // Get booking details
        const { rows: bookings } = await sql`
            SELECT 
                b.*,
                r.name as room_name,
                r.image_url as room_image,
                p.name as property_name,
                p.address as property_address,
                p.city as property_city,
                p.country as property_country,
                p.currency
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN properties p ON b.property_id = p.id
            WHERE b.id = ${id}
        `;

        if (bookings.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        const booking = bookings[0];

        // Try to get booking extras
        let extras: any[] = [];
        try {
            const { rows: bookingExtras } = await sql`
                SELECT item_name, price, quantity
                FROM booking_extras
                WHERE booking_id = ${id}
            `;
            extras = bookingExtras;
        } catch (e) {
            // booking_extras table might not exist
        }

        // Calculate nights
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        return NextResponse.json({
            success: true,
            booking: {
                id: booking.id,
                checkIn: booking.check_in,
                checkOut: booking.check_out,
                guestName: booking.guest_name,
                guestEmail: booking.guest_email,
                guestPhone: booking.guest_phone,
                guests: booking.guests,
                totalAmount: Number(booking.total_amount),
                status: booking.status,
                paymentStatus: booking.payment_status,
                createdAt: booking.created_at,
                room: {
                    name: booking.room_name,
                    imageUrl: booking.room_image
                },
                property: {
                    name: booking.property_name,
                    address: booking.property_address,
                    city: booking.property_city,
                    country: booking.property_country,
                    currency: booking.currency || 'USD'
                },
                breakdown: {
                    basePrice: Number(booking.total_amount) / nights, // Approximate
                    nights,
                    weekendSurcharge: 0,
                    extras: extras.map(e => ({
                        name: e.item_name,
                        price: Number(e.price),
                        quantity: e.quantity
                    })),
                    taxes: []
                }
            }
        });

    } catch (error) {
        console.error('Error fetching booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load booking' },
            { status: 500 }
        );
    }
}
