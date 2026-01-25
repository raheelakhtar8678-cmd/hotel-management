import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch properties or single property by ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const fields = searchParams.get('fields');

        if (id) {
            // Fetch single property - always return full details
            const { rows } = await sql`SELECT * FROM properties WHERE id = ${id} LIMIT 1`;
            const property = rows[0];

            return NextResponse.json({
                success: true,
                property
            });
        } else if (fields === 'light') {
            // Fetch lightweight property list for dropdowns/selectors
            const { rows } = await sql`
                SELECT id, name, base_price, is_active 
                FROM properties 
                WHERE is_active = true 
                ORDER BY created_at DESC
            `;

            return NextResponse.json({
                success: true,
                properties: rows || []
            });
        } else {
            // Fetch all properties with full details (default)
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
            timezone,
            caretaker_name,
            caretaker_email,
            caretaker_phone,
            structure_details,
            images
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
        const min_price = Math.floor(base_price * 0.5);
        const max_price = Math.floor(base_price * 2);

        // Convert images array to JSON for storage
        const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;

        // Use Vercel Postgres SQL
        const result = await sql`
            INSERT INTO properties (
                user_id, name, property_type, city, country, address, 
                bedrooms, bathrooms, max_guests, 
                base_price, min_price, max_price, 
                timezone, is_active,
                caretaker_name, caretaker_email, caretaker_phone, structure_details, images
            ) VALUES (
                ${userId}, ${name}, ${property_type || 'apartment'}, ${city}, 
                ${country || 'USA'}, ${address}, ${bedrooms || 1}, ${bathrooms || 1}, 
                ${max_guests || 2}, 
                ${base_price}, ${min_price}, ${max_price},
                ${timezone || 'UTC'}, true,
                ${caretaker_name}, ${caretaker_email}, ${caretaker_phone}, ${structure_details || '{}'}, ${imagesJson}
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

        const { rows } = await sql`
            UPDATE properties SET
                name = COALESCE(${updates.name}, name),
                base_price = COALESCE(${updates.base_price}, base_price),
                min_price = COALESCE(${updates.min_price}, min_price),
                max_price = COALESCE(${updates.max_price}, max_price),
                property_type = COALESCE(${updates.property_type}, property_type),
                city = COALESCE(${updates.city}, city),
                country = COALESCE(${updates.country}, country),
                caretaker_name = COALESCE(${updates.caretaker_name}, caretaker_name),
                caretaker_email = COALESCE(${updates.caretaker_email}, caretaker_email),
                caretaker_phone = COALESCE(${updates.caretaker_phone}, caretaker_phone),
                structure_details = COALESCE(${updates.structure_details}, structure_details)
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
