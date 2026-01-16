'use client';

import { AuthView } from '@neondatabase/neon-js/auth/react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">Welcome to YieldVibe</h1>
                    <p className="text-muted-foreground mt-2">Sign in to manage your properties</p>
                </div>

                <AuthView
                    onAuthSuccess={() => {
                        // Redirect to dashboard after successful auth
                        router.push('/');
                    }}
                />
            </div>
        </div>
    );
}
