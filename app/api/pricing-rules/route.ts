import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all pricing rules with optional filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const property_id = searchParams.get('property_id');
        const is_active = searchParams.get('is_active');

        let query = `
            SELECT pr.*, p.name as property_name
            FROM pricing_rules pr
            LEFT JOIN properties p ON pr.property_id = p.id
        `;

        // Build WHERE clause
        const conditions = [];
        if (property_id) conditions.push(`pr.property_id = '${property_id}'`);
        if (is_active === 'true') conditions.push(`pr.is_active = true`);

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY pr.priority DESC`;

        const { rows } = await sql.query(query);

        return NextResponse.json({
            success: true,
            rules: rows || []
        });
    } catch (error: any) {
        // Handle case where pricing_rules table doesn't exist yet
        if (error?.code === '42P01') {
            console.log('pricing_rules table does not exist yet, returning empty array');
            return NextResponse.json({
                success: true,
                rules: []
            });
        }
        console.error('Error fetching pricing rules:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch pricing rules' },
            { status: 500 }
        );
    }
}

// POST: Create new pricing rule
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            property_id,
            name,
            description,
            rule_type,
            priority,
            is_active,
            conditions,
            action,
            date_from,
            date_to,
            days_of_week,
            min_nights,
            max_nights
        } = body;

        if (!property_id || !name || !rule_type) {
            return NextResponse.json(
                { success: false, error: 'Property ID, name, and rule type are required' },
                { status: 400 }
            );
        }

        // Build conditions and action as JSONB
        const conditionsJson = conditions || {};
        const actionJson = action || { type: 'percentage', value: 0 };

        const { rows } = await sql`
            INSERT INTO pricing_rules (
                property_id, name, description, rule_type, priority, is_active,
                conditions, action, date_from, date_to, days_of_week,
                min_nights, max_nights
            ) VALUES (
                ${property_id}, ${name}, ${description || null}, ${rule_type}, 
                ${priority || 0}, ${is_active !== false},
                ${JSON.stringify(conditionsJson)}, ${JSON.stringify(actionJson)}, 
                ${date_from || null}, ${date_to || null},
                ${days_of_week || null}, ${min_nights || null}, ${max_nights || null}
            )
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            rule: rows[0]
        });
    } catch (error: any) {
        console.error('Error creating pricing rule:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to create pricing rule' },
            { status: 500 }
        );
    }
}

// PATCH: Update pricing rule
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, is_active, priority, conditions, action } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Rule ID is required' },
                { status: 400 }
            );
        }

        // Simple update - just the common fields
        const { rows } = await sql`
            UPDATE pricing_rules SET
                is_active = COALESCE(${is_active}, is_active),
                priority = COALESCE(${priority}, priority),
                conditions = COALESCE(${conditions ? JSON.stringify(conditions) : null}, conditions),
                action = COALESCE(${action ? JSON.stringify(action) : null}, action),
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Rule not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            rule: rows[0]
        });
    } catch (error) {
        console.error('Error updating pricing rule:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update pricing rule' },
            { status: 500 }
        );
    }
}

// DELETE: Delete pricing rule
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Rule ID is required' },
                { status: 400 }
            );
        }

        await sql`DELETE FROM pricing_rules WHERE id = ${id}`;

        return NextResponse.json({
            success: true,
            message: 'Pricing rule deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting pricing rule:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete pricing rule' },
            { status: 500 }
        );
    }
}
