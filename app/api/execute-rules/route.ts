import { PricingEngine } from '@/lib/engine/pricing-rules';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to manually trigger pricing rule execution
 * POST /api/execute-rules
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { property_id } = body;

        if (property_id) {
            // Execute rules for specific property
            const result = await PricingEngine.executeRulesForProperty(property_id);

            let message = `Updated ${result.updatedRooms} rooms`;
            if (result.updatedRooms === 0) {
                if (result.evaluatedRulesCount && result.evaluatedRulesCount > 0) {
                    message = `Evaluated ${result.evaluatedRulesCount} rules, but none matched current conditions (Date/Day)`;
                } else {
                    message = 'No active pricing rules found for this property';
                }
            }

            return NextResponse.json({
                success: result.success,
                message,
                updatedRooms: result.updatedRooms,
                appliedRules: result.appliedRules
            });
        } else {
            // Execute rules for all properties
            const result = await PricingEngine.executeAllRules();

            return NextResponse.json({
                success: result.success,
                message: `Processed ${result.propertiesProcessed} properties, updated ${result.totalUpdated} rooms`,
                propertiesProcessed: result.propertiesProcessed,
                totalUpdated: result.totalUpdated
            });
        }
    } catch (error) {
        console.error('Error in execute-rules API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to execute pricing rules' },
            { status: 500 }
        );
    }
}
