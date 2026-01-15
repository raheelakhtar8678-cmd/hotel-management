import { adminClient } from '@/lib/supabase/admin';
import { ICalParser } from '@/lib/ical/parser';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all calendar connections
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('property_id');

        let query = adminClient
            .from('calendar_connections')
            .select('*')
            .order('created_at', { ascending: false });

        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }

        const { data: connections, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            connections: connections || []
        });
    } catch (error) {
        console.error('Error fetching calendar connections:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch calendar connections' },
            { status: 500 }
        );
    }
}

// POST: Add new calendar connection
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { property_id, room_id, platform, ical_url, name } = body;

        if (!property_id || !ical_url) {
            return NextResponse.json(
                { success: false, error: 'Property ID and iCal URL are required' },
                { status: 400 }
            );
        }

        // Test the iCal URL to ensure it's valid
        try {
            await ICalParser.parseFromUrl(ical_url);
        } catch (parseError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid iCal URL or unable to fetch calendar data'
                },
                { status: 400 }
            );
        }

        const { data: connection, error } = await adminClient
            .from('calendar_connections')
            .insert({
                property_id,
                room_id: room_id || null,
                platform: platform || ICalParser.detectPlatform(ical_url),
                ical_url,
                name: name || `${platform || 'Calendar'} Import`,
                is_active: true,
                sync_status: 'pending',
                last_sync_at: null
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            connection,
            message: 'Calendar connection added. Sync will start automatically.'
        });
    } catch (error) {
        console.error('Error creating calendar connection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create calendar connection' },
            { status: 500 }
        );
    }
}

// PATCH: Update calendar connection
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Connection ID is required' },
                { status: 400 }
            );
        }

        const { data: connection, error } = await adminClient
            .from('calendar_connections')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            connection
        });
    } catch (error) {
        console.error('Error updating calendar connection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update calendar connection' },
            { status: 500 }
        );
    }
}

// DELETE: Remove calendar connection
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Connection ID is required' },
                { status: 400 }
            );
        }

        const { error } = await adminClient
            .from('calendar_connections')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Calendar connection removed'
        });
    } catch (error) {
        console.error('Error deleting calendar connection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete calendar connection' },
            { status: 500 }
        );
    }
}
