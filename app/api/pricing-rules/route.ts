import { adminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all pricing rules
export async function GET() {
    try {
        const { data: rules, error } = await adminClient
            .from('pricing_rules')
            .select('*, properties(name)')
            .order('priority', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            rules: rules || []
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

        const { data: rule, error } = await adminClient
            .from('pricing_rules')
            .insert({
                property_id,
                name,
                rule_type,
                priority: priority || 0,
                is_active: is_active !== false,
                conditions: conditions || {},
                action: action || {},
                date_from: date_from || null,
                date_to: date_to || null,
                days_of_week: days_of_week || null,
                min_nights: min_nights || null,
                max_nights: max_nights || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            rule
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

        const { data: rule, error } = await adminClient
            .from('pricing_rules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            rule
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

        const { error } = await adminClient
            .from('pricing_rules')
            .delete()
            .eq('id', id);

        if (error) throw error;

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
