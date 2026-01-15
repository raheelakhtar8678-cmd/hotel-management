
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = await request.json();

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { success: false, error: 'Project URL and Service Key are required' },
                { status: 400 }
            );
        }

        // Create a temporary client with the provided credentials
        const tempClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        // Test the connection by trying to list users (requires admin/service role)
        // or checking a public table. Listing users is a good test of the Service Key.
        const { data, error } = await tempClient.auth.admin.listUsers({ page: 1, perPage: 1 });

        if (error) {
            console.error('Connection test failed:', error);
            // Customize error message for common issues
            if (error.message.includes('Invalid API key')) {
                return NextResponse.json({ success: false, error: 'Invalid Service Role Key' }, { status: 401 });
            }
            if (error.message.includes('FetchError') || error.message.includes('ENOTFOUND')) {
                return NextResponse.json({ success: false, error: 'Invalid Project URL' }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: `Connection failed: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Connection successful!'
        });

    } catch (error: any) {
        console.error('Test endpoint error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Unknown error during test' },
            { status: 500 }
        );
    }
}
