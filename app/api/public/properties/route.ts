import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

/**
 * Public API to get all properties with room counts
 * No authentication required
 */

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get all properties with room counts
        const { rows: properties } = await sql`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.address,
                p.city,
                p.country,
                p.image_url,
                p.slug,
                p.property_type,
                p.currency,
                COALESCE(
                    (SELECT MIN(r.base_price) FROM rooms r WHERE r.property_id = p.id),
                    0
                ) as min_price,
                COALESCE(
                    (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id),
                    0
                ) as room_count
            FROM properties p
            ORDER BY p.name ASC
        `;

        return NextResponse.json({
            success: true,
            properties: properties.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                address: p.address,
                city: p.city,
                country: p.country,
                imageUrl: p.image_url,
                slug: p.slug || p.id,
                propertyType: p.property_type,
                currency: p.currency || 'USD',
                minPrice: Number(p.min_price) || 0,
                roomCount: Number(p.room_count) || 0
            }))
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load properties' },
            { status: 500 }
        );
    }
}
