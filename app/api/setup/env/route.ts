
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = body;

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Path to .env.local
        const envPath = path.join(process.cwd(), '.env.local');

        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Helper to update or append variable
        const updateEnvVar = (key: string, value: string) => {
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        };

        // Update the Supabase variables
        updateEnvVar('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
        updateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);
        updateEnvVar('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceKey);

        // Construct Database URL if not present or needs update
        // We can try to assume the postgres connection string format based on the project URL
        // Project URL: https://[project-ref].supabase.co
        // DB URL: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
        // NOTE: We can't know the password here unless we ask for it.
        // For now, let's just save the API keys. 
        // If the user wants full DB connection they might need to update DATABASE_URL manually or we add a password field.

        // Let's add a password field to the request!
        if (body.connectionString) {
            updateEnvVar('DATABASE_URL', body.connectionString);
        } else if (body.dbPassword) {
            const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
            const dbUrl = `postgresql://postgres:${body.dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
            updateEnvVar('DATABASE_URL', dbUrl);
        }

        // Write back to file
        fs.writeFileSync(envPath, envContent.trim() + '\n');

        return NextResponse.json({
            success: true,
            message: 'Configuration saved. Server restarting...'
        });

    } catch (error) {
        console.error('Error saving config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save configuration' },
            { status: 500 }
        );
    }
}
