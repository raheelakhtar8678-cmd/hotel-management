'use client';

import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import '@neondatabase/neon-js/ui/css';
import { authClient } from '@/lib/neon-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <NeonAuthUIProvider emailOTP authClient={authClient}>
            {children}
        </NeonAuthUIProvider>
    );
}
