import { createClient } from '@supabase/supabase-js';

// Note: This client uses the SERVICE_ROLE_KEY. 
// It should ONLY be used in secure server-side contexts (API routes, Cron jobs).
// NEVER expose this client to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Supabase environment variables are missing. Admin client will not work.');
}

export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
