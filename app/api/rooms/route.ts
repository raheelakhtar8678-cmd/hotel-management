import { adminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Create new room
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { property_id, type, status } = body;

        if (!property_id) {
            return NextResponse.json(
                { success: false, error: 'Property ID is required' },
                { status: 400 }
            );
        }

        // Get property to inherit base price
        const { data: property } = await adminClient
            .from('properties')
            .select('base_price')
            .eq('id', property_id)
            .single();

        const { data: room, error } = await adminClient
            .from('rooms')
            .insert({
                property_id,
                type: type || 'Standard',
                status: status || 'available',
                current_price: property?.base_price || 100,
                last_logic_reason: 'Initial setup'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create room' },
            { status: 500 }
        );
    }
}
