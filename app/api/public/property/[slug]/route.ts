import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API to get property details for booking page
 * No authentication required
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json(
                { success: false, error: 'Property slug is required' },
                { status: 400 }
            );
        }

        // Try to find property by slug or ID
        const { rows: properties } = await sql`
            SELECT * FROM properties 
            WHERE slug = ${slug} OR id::text = ${slug}
            LIMIT 1
        `;

        if (properties.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Property not found' },
                { status: 404 }
            );
        }

        const property = properties[0];

        // Get rooms for this property
        const { rows: rooms } = await sql`
            SELECT id, name, type, base_price, image_url, max_guests, amenities, status
            FROM rooms 
            WHERE property_id = ${property.id} AND is_active = true
            ORDER BY base_price ASC
        `;

        // Get confirmed bookings for availability check (next 90 days)
        const { rows: bookings } = await sql`
            SELECT room_id, check_in, check_out 
            FROM bookings 
            WHERE room_id IN (SELECT id FROM rooms WHERE property_id = ${property.id})
            AND check_out >= CURRENT_DATE
            AND check_in <= CURRENT_DATE + INTERVAL '90 days'
            AND status = 'confirmed'
        `;

        return NextResponse.json({
            success: true,
            property: {
                id: property.id,
                name: property.name,
                address: property.address,
                city: property.city,
                country: property.country,
                description: property.description,
                image_url: property.image_url,
                currency: property.currency || 'USD'
            },
            rooms: rooms.map(room => ({
                id: room.id,
                name: room.name,
                type: room.type,
                basePrice: room.base_price,
                imageUrl: room.image_url,
                maxGuests: room.max_guests,
                amenities: room.amenities || [],
                status: room.status
            })),
            bookedDates: bookings.map(b => ({
                roomId: b.room_id,
                checkIn: b.check_in,
                checkOut: b.check_out
            }))
        });

    } catch (error) {
        console.error('Error fetching property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load property' },
            { status: 500 }
        );
    }
}
