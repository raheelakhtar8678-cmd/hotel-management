import { adminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all settings
export async function GET() {
    try {
        const { data: settings, error } = await adminClient
            .from('system_settings')
            .select('*');

        if (error) throw error;

        return NextResponse.json({
            success: true,
            settings: settings || []
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// POST: Update settings
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { floor_price, ceiling_price, openai_key, gemini_key } = body;

        const updates = [
            { key: 'floor_price', value: floor_price?.toString() || '99' },
            { key: 'ceiling_price', value: ceiling_price?.toString() || '400' },
            { key: 'openai_key', value: openai_key || '' },
            { key: 'gemini_key', value: gemini_key || '' },
        ];

        for (const setting of updates) {
            await adminClient
                .from('system_settings')
                .upsert(
                    {
                        key: setting.key,
                        value: setting.value,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'key' }
                );
        }

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
