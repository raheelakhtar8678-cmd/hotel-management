import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Get Gemini API key from environment variable
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            return NextResponse.json({
                error: 'Gemini API key not configured. Please add GEMINI_API_KEY to environment variables.'
            }, { status: 400 });
        }

        // Fetch recent bookings and rooms data
        const { rows: bookings } = await sql`
            SELECT b.*, r.type, r.current_price 
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE b.status = 'confirmed'
            ORDER BY b.created_at DESC
            LIMIT 50
        `;

        const { rows: rooms } = await sql`SELECT * FROM rooms`;

        // Calculate occupancy and trends
        const today = new Date().toISOString().split('T')[0];
        const occupiedCount = bookings.filter(
            (b: any) => b.check_in <= today && b.check_out > today
        ).length;
        const occupancyRate = rooms.length
            ? ((occupiedCount / rooms.length) * 100).toFixed(0)
            : 0;

        // Prepare prompt for Gemini
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `You are a hotel revenue management AI advisor. Based on the following data, generate EXACTLY 3 actionable revenue insights.

Current Hotel Status:
- Occupancy Rate: ${occupancyRate}%
- Total Rooms: ${rooms.length || 0}
- Recent Bookings: ${bookings.length || 0}

For each insight, provide:
1. Type (event_alert, demand_surge, or competitor_update)
2. Title (short, compelling)
3. Description (1-2 sentences explaining the opportunity)
4. Suggested Action (specific recommendation)
5. Price Change Percentage (integer, can be positive or negative)
6. Estimated Revenue Impact (dollar amount)

Return ONLY valid JSON array with 3 insights in this exact format:
[
  {
    "type": "event_alert",
    "title": "Event Alert Title",
    "description": "Brief description",
    "suggestedAction": "Specific action",
    "priceChange": 15,
    "estimatedRevenue": 400
  }
]

Requirements:
- Be creative and realistic
- Mix different types of insights
- Keep it actionable and specific
- Return ONLY the JSON array, no markdown, no explanations`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse AI response
        let insights = [];
        try {
            // Remove markdown code blocks if present
            const jsonText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            insights = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback to mock insights
            insights = [
                {
                    type: 'event_alert',
                    title: 'Local Event Detected',
                    description: 'Major event in your area could drive demand.',
                    suggestedAction: 'Increase rates by 15% for peak dates',
                    priceChange: 15,
                    estimatedRevenue: 400
                },
                {
                    type: 'demand_surge',
                    title: 'Weekend Demand Pattern',
                    description: 'Historical data shows strong weekend bookings.',
                    suggestedAction: 'Apply weekend premium pricing',
                    priceChange: 12,
                    estimatedRevenue: 320
                },
                {
                    type: 'competitor_update',
                    title: 'Market Rate Analysis',
                    description: 'Your pricing is competitive with local market.',
                    suggestedAction: 'Maintain current strategy',
                    priceChange: 0,
                    estimatedRevenue: 0
                }
            ];
        }

        // Delete old pending insights
        await sql`DELETE FROM ai_insights WHERE status = 'pending'`;

        // Save insights to database
        const insightsToSave = insights.slice(0, 3);

        for (const insight of insightsToSave) {
            await sql`
                INSERT INTO ai_insights (
                    type, title, description, suggested_action,
                    suggested_price_change, estimated_revenue_impact, status
                ) VALUES (
                    ${insight.type}, ${insight.title}, ${insight.description},
                    ${insight.suggestedAction}, ${insight.priceChange},
                    ${insight.estimatedRevenue}, 'pending'
                )
            `;
        }

        // Fetch saved insights
        const { rows: savedInsights } = await sql`
            SELECT * FROM ai_insights WHERE status = 'pending' ORDER BY created_at DESC
        `;

        return NextResponse.json({
            success: true,
            insights: savedInsights,
            message: `Generated ${savedInsights.length} new insights`
        });

    } catch (error: any) {
        console.error('Error generating insights:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate insights'
        }, { status: 500 });
    }
}
