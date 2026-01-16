import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all pricing rules
export async function GET() {
    try {
        const { rows } = await sql`
            SELECT pr.*, p.name as property_name
            FROM pricing_rules pr
            LEFT JOIN properties p ON pr.property_id = p.id
            ORDER BY pr.priority DESC
        `;

        return NextResponse.json({
            success: true,
            rules: rows || []
        });
    } catch (error) {
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
            rule_type,
            priority,
            is_active,
            conditions,
            date_from,
            date_to,
            days_of_week,
            adjustment_type,
            adjustment_value
        } = body;

        if (!property_id || !name || !rule_type) {
            return NextResponse.json(
                { success: false, error: 'Property ID, name, and rule type are required' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            INSERT INTO pricing_rules (
                property_id, name, rule_type, priority, is_active,
                conditions, date_from, date_to, days_of_week,
                adjustment_type, adjustment_value
            ) VALUES (
                ${property_id}, ${name}, ${rule_type}, ${priority || 0}, ${is_active !== false},
                ${JSON.stringify(conditions || {})}, ${date_from || null}, ${date_to || null},
                ${days_of_week || null}, ${adjustment_type || 'percentage'}, ${adjustment_value || 0}
            )
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            rule: rows[0]
        });
    } catch (error) {
        console.error('Error creating pricing rule:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create pricing rule' },
            { status: 500 }
        );
    }
}

// PATCH: Update pricing rule
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Rule ID is required' },
                { status: 400 }
            );
        }

        // Build update query dynamically
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
        });

        if (updateFields.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields to update' },
                { status: 400 }
            );
        }

        const { rows } = await sql.query(
            `UPDATE pricing_rules SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            [...updateValues, id]
        );

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
