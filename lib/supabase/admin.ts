import { createClient } from '@supabase/supabase-js';

// Note: This client uses the SERVICE_ROLE_KEY. 
// It should ONLY be used in secure server-side contexts (API routes, Cron jobs).
// NEVER expose this client to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    // In development, we might not have keys set yet, but this will fail at runtime if not present.
    // We allow the module to load, but the client creation will fail or throw if used.
}

export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
