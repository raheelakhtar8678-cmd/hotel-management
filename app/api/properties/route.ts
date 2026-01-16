import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch properties or single property by ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Fetch single property
            const { rows } = await sql`SELECT * FROM properties WHERE id = ${id} LIMIT 1`;
            const property = rows[0];

            return NextResponse.json({
                success: true,
                property
            });
        } else {
            // Fetch all properties
            const { rows } = await sql`SELECT * FROM properties ORDER BY created_at DESC`;

            return NextResponse.json({
                success: true,
                properties: rows || []
            });
        }
    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch properties' },
            { status: 500 }
        );
    }
}

// POST: Create new property
export async function POST(request: Request) {
    try {
        console.log('🔵 [API] POST /api/properties - Starting (Vercel Postgres)...');

        const body = await request.json();
        console.log('📥 [API] Received body:', body);

        const {
            name,
            property_type,
            city,
            country,
            address,
            bedrooms,
            bathrooms,
            max_guests,
            base_price,
            timezone
        } = body;

        if (!name || !base_price) {
            console.error('❌ [API] Missing required fields');
            return NextResponse.json(
                { success: false, error: 'Name and base price are required' },
                { status: 400 }
            );
        }

        // Get demo user ID (in production, use auth)
        const userId = '00000000-0000-0000-0000-000000000001';

        // Calculate min and max prices automatically
        // min_price = 50% of base_price, max_price = 200% of base_price
        const min_price = Math.floor(base_price * 0.5);
        const max_price = Math.floor(base_price * 2);

        // Use Vercel Postgres SQL
        const result = await sql`
            INSERT INTO properties (
                user_id, name, property_type, city, country, address, 
                bedrooms, bathrooms, max_guests, 
                base_price, min_price, max_price, 
                timezone, is_active
            ) VALUES (
                ${userId}, ${name}, ${property_type || 'apartment'}, ${city}, 
                ${country || 'USA'}, ${address}, ${bedrooms || 1}, ${bathrooms || 1}, 
                ${max_guests || 2}, 
                ${base_price}, ${min_price}, ${max_price},
                ${timezone || 'UTC'}, true
            )
            RETURNING *;
        `;

        const property = result.rows[0];
        console.log('✅ [API] Property created:', property);

        // Create default room
        console.log('🛏️ [API] Creating default room...');
        await sql`
            INSERT INTO rooms (
                property_id, type, status, current_price
            ) VALUES (
                ${property.id}, 'Standard', 'available', ${base_price}
            )
        `;
        console.log('✅ [API] Default room created');

        return NextResponse.json({
            success: true,
            property
        });
    } catch (error) {
        console.error('❌ [API] Error creating property:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create property',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

// PATCH: Update property
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Property ID is required' },
                { status: 400 }
            );
        }

        // Dynamic update query building is tricky with tagged templates.
        // For simplicity in this migration, we'll manually check fields or just execute a fixed update 
        // if we knew the fields. Since 'updates' is dynamic, it's harder with strict SQL tags.
        // Let's assume we update specific known fields for now or use a helper if we had one.
        // For MVP speed: just update common fields.

        // A robust way for dynamic updates with @vercel/postgres needs a helper.
        // We will just try to update all potential fields if they exist in body.

        const { rows } = await sql`
            UPDATE properties SET
                name = COALESCE(${updates.name}, name),
                base_price = COALESCE(${updates.base_price}, base_price),
                min_price = COALESCE(${updates.min_price}, min_price),
                max_price = COALESCE(${updates.max_price}, max_price),
                property_type = COALESCE(${updates.property_type}, property_type),
                 city = COALESCE(${updates.city}, city),
                 country = COALESCE(${updates.country}, country)
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            property: rows[0]
        });
    } catch (error) {
        console.error('Error updating property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update property' },
            { status: 500 }
        );
    }
}

// DELETE: Archive property (soft delete)
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Property ID is required' },
                { status: 400 }
            );
        }

        await sql`
            UPDATE properties 
            SET is_active = false, archived_at = NOW()
            WHERE id = ${id}
        `;

        return NextResponse.json({
            success: true,
            message: 'Property archived successfully'
        });
    } catch (error) {
        console.error('Error archiving property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to archive property' },
            { status: 500 }
        );
    }
}
