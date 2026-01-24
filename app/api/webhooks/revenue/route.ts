import { NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';
import {
    validateApiKey,
    hasPermission,
    unauthorizedResponse,
    forbiddenResponse,
    badRequestResponse,
    successResponse,
    handleCorsPreFlight,
    corsHeaders
} from '@/lib/api-auth';

/**
 * Webhook API: Revenue
 * 
 * GET /api/webhooks/revenue - Get revenue summary and statistics
 * 
 * Query params:
 * - period: 'today', 'week', 'month', 'year', 'custom'
 * - start_date: YYYY-MM-DD (for custom period)
 * - end_date: YYYY-MM-DD (for custom period)
 * - property_id: Filter by property
 */

export async function OPTIONS() {
    return handleCorsPreFlight();
}

export async function GET(request: NextRequest) {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return unauthorizedResponse(auth.error);
    }

    if (!hasPermission(auth, 'read')) {
        return forbiddenResponse('API key does not have read permission');
    }

    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month';
        const propertyId = searchParams.get('property_id');
        let startDate = searchParams.get('start_date');
        let endDate = searchParams.get('end_date');

        // Calculate date range based on period
        const now = new Date();

        if (period === 'today') {
            startDate = now.toISOString().split('T')[0];
            endDate = startDate;
        } else if (period === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            startDate = weekAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
        } else if (period === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            startDate = monthAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
        } else if (period === 'year') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            startDate = yearAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
        } else if (period === 'custom') {
            if (!startDate || !endDate) {
                return badRequestResponse('start_date and end_date required for custom period');
            }
        }

        // Build revenue query
        let revenueQuery = `
            SELECT 
                COALESCE(SUM(b.total_paid), 0) as total_revenue,
                COALESCE(SUM(b.refund_amount), 0) as total_refunds,
                COUNT(DISTINCT b.id) as total_bookings,
                COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
                COUNT(DISTINCT CASE WHEN b.refund_amount > 0 THEN b.id END) as refunded_bookings,
                AVG(b.total_paid) as avg_booking_value,
                COUNT(DISTINCT r.id) as rooms_booked
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN properties p ON r.property_id = p.id
            WHERE b.created_at >= $1 AND b.created_at <= $2
        `;

        const params: any[] = [startDate, endDate + ' 23:59:59'];
        let paramIndex = 3;

        if (propertyId) {
            revenueQuery += ` AND p.id = $${paramIndex}`;
            params.push(propertyId);
            paramIndex++;
        }

        const { rows: revenueData } = await sql.query(revenueQuery, params);
        const revenue = revenueData[0];

        // Calculate net revenue
        const totalRevenue = parseFloat(revenue.total_revenue) || 0;
        const totalRefunds = parseFloat(revenue.total_refunds) || 0;
        const netRevenue = totalRevenue - totalRefunds;

        // Get revenue by channel
        let channelQuery = `
            SELECT 
                COALESCE(b.channel, 'direct') as channel,
                SUM(b.total_paid) as revenue,
                COUNT(*) as bookings
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN properties p ON r.property_id = p.id
            WHERE b.created_at >= $1 AND b.created_at <= $2
        `;

        const channelParams: any[] = [startDate, endDate + ' 23:59:59'];

        if (propertyId) {
            channelQuery += ` AND p.id = $3`;
            channelParams.push(propertyId);
        }

        channelQuery += ' GROUP BY b.channel ORDER BY revenue DESC';

        const { rows: channelData } = await sql.query(channelQuery, channelParams);

        // Get daily revenue for the period
        let dailyQuery = `
            SELECT 
                DATE(b.created_at) as date,
                SUM(b.total_paid) as revenue,
                COUNT(*) as bookings
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN properties p ON r.property_id = p.id
            WHERE b.created_at >= $1 AND b.created_at <= $2
        `;

        const dailyParams: any[] = [startDate, endDate + ' 23:59:59'];

        if (propertyId) {
            dailyQuery += ` AND p.id = $3`;
            dailyParams.push(propertyId);
        }

        dailyQuery += ' GROUP BY DATE(b.created_at) ORDER BY date';

        const { rows: dailyData } = await sql.query(dailyQuery, dailyParams);

        return successResponse({
            period: {
                type: period,
                start_date: startDate,
                end_date: endDate,
                property_id: propertyId || null
            },
            summary: {
                total_revenue: totalRevenue,
                total_refunds: totalRefunds,
                net_revenue: netRevenue,
                total_bookings: parseInt(revenue.total_bookings) || 0,
                confirmed_bookings: parseInt(revenue.confirmed_bookings) || 0,
                refunded_bookings: parseInt(revenue.refunded_bookings) || 0,
                average_booking_value: parseFloat(revenue.avg_booking_value) || 0,
                rooms_booked: parseInt(revenue.rooms_booked) || 0,
                currency: 'USD'
            },
            by_channel: channelData.map(c => ({
                channel: c.channel,
                revenue: parseFloat(c.revenue) || 0,
                bookings: parseInt(c.bookings) || 0,
                percentage: totalRevenue > 0 ? ((parseFloat(c.revenue) / totalRevenue) * 100).toFixed(1) : '0'
            })),
            daily_breakdown: dailyData.map(d => ({
                date: d.date,
                revenue: parseFloat(d.revenue) || 0,
                bookings: parseInt(d.bookings) || 0
            }))
        });

    } catch (error) {
        console.error('Webhook revenue error:', error);
        return Response.json(
            { success: false, error: 'Failed to fetch revenue data' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
