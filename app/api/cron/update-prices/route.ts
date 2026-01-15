import { NextRequest, NextResponse } from 'next/server';
import { PricingEngine } from '@/lib/engine/pricing-rules';

/**
 * Automated Pricing Update Cron Job
 * Runs pricing rules engine automatically
 * Secured with CRON_SECRET environment variable
 * 
 * Setup on Vercel:
 * 1. Add CRON_SECRET to environment variables
 * 2. Configure cron schedule in vercel.json
 * 3. Call: GET /api/cron/update-prices
 *    Header: Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: NextRequest) {
    // Security Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('[CRON] Starting automated pricing update...');

        // Execute pricing rules for all properties
        const result = await PricingEngine.executeAllRules();

        if (result.success) {
            console.log(`[CRON] Successfully processed ${result.propertiesProcessed} properties`);
            console.log(`[CRON] Updated ${result.totalUpdated} rooms`);

            return NextResponse.json({
                success: true,
                message: `Automated pricing complete`,
                propertiesProcessed: result.propertiesProcessed,
                roomsUpdated: result.totalUpdated,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('[CRON] Failed to execute pricing rules');
            return new NextResponse('Pricing execution failed', { status: 500 });
        }
    } catch (error) {
        console.error('[CRON] Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
