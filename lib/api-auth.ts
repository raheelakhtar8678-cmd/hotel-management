import { sql } from '@vercel/postgres';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * API Authentication Middleware
 * Validates API keys for webhook endpoints
 */

export interface ApiKeyValidation {
    valid: boolean;
    keyId?: string;
    keyName?: string;
    permissions?: string[];
    error?: string;
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
    // Generate a 32-byte random key, encoded as base64
    const randomBytes = crypto.randomBytes(32);
    const key = `yvb_${randomBytes.toString('base64url')}`;
    return key;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key from request headers
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidation> {
    try {
        // Get API key from Authorization header or X-API-Key header
        const authHeader = request.headers.get('authorization');
        const apiKeyHeader = request.headers.get('x-api-key');

        let apiKey: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7);
        } else if (apiKeyHeader) {
            apiKey = apiKeyHeader;
        }

        if (!apiKey) {
            return {
                valid: false,
                error: 'Missing API key. Provide via Authorization: Bearer <key> or X-API-Key header'
            };
        }

        // Hash the provided key and look it up
        const keyHash = hashApiKey(apiKey);

        const { rows } = await sql`
            SELECT id, name, permissions 
            FROM api_keys 
            WHERE key_hash = ${keyHash}
        `;

        if (rows.length === 0) {
            return {
                valid: false,
                error: 'Invalid API key'
            };
        }

        const keyRecord = rows[0];

        // Update last_used_at
        await sql`
            UPDATE api_keys 
            SET last_used_at = NOW() 
            WHERE id = ${keyRecord.id}
        `;

        return {
            valid: true,
            keyId: keyRecord.id,
            keyName: keyRecord.name,
            permissions: keyRecord.permissions || ['read']
        };

    } catch (error) {
        console.error('API key validation error:', error);
        return {
            valid: false,
            error: 'Authentication failed'
        };
    }
}

/**
 * Check if a key has a specific permission
 */
export function hasPermission(validation: ApiKeyValidation, permission: string): boolean {
    if (!validation.valid || !validation.permissions) return false;
    return validation.permissions.includes(permission) || validation.permissions.includes('admin');
}

/**
 * Standard API error responses
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
    return Response.json(
        { success: false, error: message },
        { status: 401, headers: corsHeaders() }
    );
}

export function forbiddenResponse(message: string = 'Forbidden') {
    return Response.json(
        { success: false, error: message },
        { status: 403, headers: corsHeaders() }
    );
}

export function badRequestResponse(message: string) {
    return Response.json(
        { success: false, error: message },
        { status: 400, headers: corsHeaders() }
    );
}

export function successResponse(data: any) {
    return Response.json(
        { success: true, ...data },
        { status: 200, headers: corsHeaders() }
    );
}

/**
 * CORS headers for API endpoints
 */
export function corsHeaders(): HeadersInit {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });
}
