import { createAuthClient } from '@neondatabase/neon-js/auth';

// Use the Neon Auth URL from environment variables
export const authClient = createAuthClient(
    process.env.NEXT_PUBLIC_NEON_AUTH_URL || ''
);
