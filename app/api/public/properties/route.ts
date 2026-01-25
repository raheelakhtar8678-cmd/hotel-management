import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

/**
 * Public API to get all properties with room counts
 * No authentication required
 */

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get all properties - only select columns that definitely exist
        // Handle optional columns like slug, image_url, property_type gracefully
        const { rows: properties } = await sql`
            SELECT 
                p.id,
                p.name,
                p.city,
                p.country,
                p.address
            FROM properties p
            ORDER BY p.name ASC
        `;

        // Get room counts for each property
        const propertiesWithRooms = await Promise.all(
            properties.map(async (p) => {
                try {
                    const { rows: roomCount } = await sql`
                        SELECT COUNT(*) as count, MIN(base_price) as min_price
                        FROM rooms 
                        WHERE property_id = ${p.id}
                    `;

                    return {
                        id: p.id,
                        name: p.name,
                        description: '', // Will be populated if column exists
                        address: p.address || '',
                        city: p.city || '',
                        country: p.country || '',
                        imageUrl: '', // Will be populated if column exists
                        slug: p.id, // Use ID as slug fallback
                        propertyType: 'property',
                        currency: 'USD',
                        minPrice: Number(roomCount[0]?.min_price) || 0,
                        roomCount: Number(roomCount[0]?.count) || 0
                    };
                } catch (err) {
                    console.error(`Error fetching room count for property ${p.id}:`, err);
                    return {
                        id: p.id,
                        name: p.name,
                        description: '',
                        address: p.address || '',
                        city: p.city || '',
                        country: p.country || '',
                        imageUrl: '',
                        slug: p.id,
                        propertyType: 'property',
                        currency: 'USD',
                        minPrice: 0,
                        roomCount: 0
                    };
                }
            })
        );

        return NextResponse.json({
            success: true,
            properties: propertiesWithRooms
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load properties', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
