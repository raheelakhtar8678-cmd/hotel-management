import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API to get room details with extras
 * No authentication required
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
                { success: false, error: 'Room ID is required' },
                { status: 400 }
            );
        }

        // Get room details
        const { rows: rooms } = await sql`
            SELECT 
                r.*,
                p.name as property_name,
                p.slug as property_slug,
                p.address as property_address,
                p.city as property_city,
                p.country as property_country,
                p.currency
            FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE r.id = ${id} AND r.is_active = true
        `;

        if (rooms.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        const room = rooms[0];

        // Get room extras
        const { rows: extras } = await sql`
            SELECT id, item_name, price, description, item_category
            FROM room_extras
            WHERE room_id = ${id}
            ORDER BY item_name ASC
        `;

        // Get confirmed bookings for this room (next 90 days)
        const { rows: bookings } = await sql`
            SELECT check_in, check_out
            FROM bookings
            WHERE room_id = ${id}
            AND check_out >= CURRENT_DATE
            AND check_in <= CURRENT_DATE + INTERVAL '90 days'
            AND status IN ('confirmed', 'checked_in')
        `;

        // Get taxes for the property
        const { rows: taxes } = await sql`
            SELECT id, name, type, value, applies_to
            FROM taxes
            WHERE property_id = ${room.property_id} AND is_active = true
        `;

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                name: room.name,
                type: room.type,
                description: room.description,
                basePrice: Number(room.base_price),
                imageUrl: room.image_url,
                images: room.images || [],
                maxGuests: room.max_guests,
                amenities: room.amenities || [],
                status: room.status,
                bedType: room.bed_type,
                size: room.size,
                floor: room.floor,
                property: {
                    id: room.property_id,
                    name: room.property_name,
                    slug: room.property_slug,
                    address: room.property_address,
                    city: room.property_city,
                    country: room.property_country,
                    currency: room.currency || 'USD'
                }
            },
            extras: extras.map(e => ({
                id: e.id,
                name: e.item_name,
                price: Number(e.price),
                description: e.description,
                category: e.item_category
            })),
            bookedDates: bookings.map(b => ({
                checkIn: b.check_in,
                checkOut: b.check_out
            })),
            taxes: taxes.map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                value: Number(t.value),
                appliesTo: t.applies_to
            }))
        });

    } catch (error) {
        console.error('Error fetching room:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load room' },
            { status: 500 }
        );
    }
}
