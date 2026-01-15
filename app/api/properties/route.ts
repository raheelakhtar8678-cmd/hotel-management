import { adminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch properties or single property by ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Fetch single property
            const { data: property, error } = await adminClient
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return NextResponse.json({
                success: true,
                property
            });
        } else {
            // Fetch all properties
            const { data: properties, error } = await adminClient
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return NextResponse.json({
                success: true,
                properties: properties || []
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
        console.log('🔵 [API] POST /api/properties - Starting...');

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
        console.log('👤 [API] Using user ID:', userId);

        const propertyData = {
            user_id: userId,
            name,
            property_type: property_type || 'apartment',
            city,
            country: country || 'USA',
            address,
            bedrooms: bedrooms || 1,
            bathrooms: bathrooms || 1,
            max_guests: max_guests || 2,
            base_price: Number(base_price),
            timezone: timezone || 'UTC',
            is_active: true,
        };

        console.log('💾 [API] Inserting property:', propertyData);

        const { data: property, error } = await adminClient
            .from('properties')
            .insert(propertyData)
            .select()
            .single();

        if (error) {
            console.error('❌ [API] Database error:', error);
            throw error;
        }

        console.log('✅ [API] Property created:', property);

        // Also create a default room for this property
        console.log('🛏️ [API] Creating default room...');
        const roomResult = await adminClient.from('rooms').insert({
            property_id: property.id,
            type: 'Standard',
            status: 'available',
            current_price: Number(base_price),
        });

        if (roomResult.error) {
            console.warn('⚠️ [API] Failed to create default room:', roomResult.error);
        } else {
            console.log('✅ [API] Default room created');
        }

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

        const { data: property, error } = await adminClient
            .from('properties')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            property
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

        const { error } = await adminClient
            .from('properties')
            .update({
                is_active: false,
                archived_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

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
