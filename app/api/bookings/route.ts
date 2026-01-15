import { adminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Create new booking
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            room_id,
            guest_name,
            guest_email,
            check_in,
            check_out,
            guests,
            total_paid,
            status,
            channel
        } = body;

        if (!room_id || !guest_name || !check_in || !check_out) {
            return NextResponse.json(
                { success: false, error: 'Room, guest name, check-in, and check-out are required' },
                { status: 400 }
            );
        }

        const { data: booking, error } = await adminClient
            .from('bookings')
            .insert({
                room_id,
                guest_name,
                guest_email: guest_email || null,
                check_in,
                check_out,
                guests: guests || 1,
                total_paid: total_paid || 0,
                status: status || 'confirmed',
                channel: channel || 'direct',
            })
            .select()
            .single();

        if (error) throw error;

        // Update room status to occupied
        await adminClient
            .from('rooms')
            .update({ status: 'occupied' })
            .eq('id', room_id);

        return NextResponse.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}
