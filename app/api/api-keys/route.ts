import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { generateApiKey, hashApiKey } from '@/lib/api-auth';

/**
 * API Keys Management
 * 
 * GET - List all API keys (without the actual key values)
 * POST - Create a new API key
 * DELETE - Revoke an API key
 */

// GET - List API keys
export async function GET() {
    try {
        const { rows } = await sql`
            SELECT id, name, permissions, description, last_used_at, created_at, is_active
            FROM api_keys
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ success: true, keys: rows });
    } catch (error: any) {
        // If table doesn't exist, return empty array with migration hint
        if (error.message?.includes('does not exist')) {
            return NextResponse.json({
                success: true,
                keys: [],
                needsMigration: true,
                migrationSql: `CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '["read"]',
    description TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);`
            });
        }
        console.error('Error fetching API keys:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, permissions = ['read'], description = '' } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        // Generate a new API key
        const apiKey = generateApiKey();
        const keyHash = hashApiKey(apiKey);

        // Store the hashed key
        const { rows } = await sql`
            INSERT INTO api_keys (name, key_hash, permissions, description)
            VALUES (${name}, ${keyHash}, ${JSON.stringify(permissions)}, ${description})
            RETURNING id, name, permissions, description, created_at
        `;

        // Return the key - this is the ONLY time it will be shown!
        return NextResponse.json({
            success: true,
            key: {
                id: rows[0].id,
                name: rows[0].name,
                apiKey: apiKey, // Only returned once!
                permissions: rows[0].permissions,
                description: rows[0].description,
                created_at: rows[0].created_at
            },
            message: 'API key created. Save this key securely - it will not be shown again!'
        });

    } catch (error: any) {
        console.error('Error creating API key:', error);

        if (error.message?.includes('does not exist')) {
            return NextResponse.json({
                success: false,
                error: 'API keys table not found. Please run the migration first.',
                needsMigration: true
            }, { status: 400 });
        }

        return NextResponse.json({ success: false, error: 'Failed to create API key' }, { status: 500 });
    }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        await sql`DELETE FROM api_keys WHERE id = ${id}`;

        return NextResponse.json({ success: true, message: 'API key revoked' });

    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json({ success: false, error: 'Failed to revoke API key' }, { status: 500 });
    }
}
