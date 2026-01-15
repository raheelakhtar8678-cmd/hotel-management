import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { insightId } = body;

        if (!insightId) {
            return NextResponse.json({ error: 'Insight ID required' }, { status: 400 });
        }

        // Fetch the insight
        const { data: insight, error: fetchError } = await adminClient
            .from('ai_insights')
            .select('*')
            .eq('id', insightId)
            .single();

        if (fetchError || !insight) {
            return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
        }

        // Fetch price limits from settings
        const { data: settings } = await adminClient.from('system_settings').select('*');
        const floorPrice = Number(settings?.find(s => s.key === 'floor_price')?.value || 99);
        const ceilingPrice = Number(settings?.find(s => s.key === 'ceiling_price')?.value || 400);

        // Fetch all available rooms
        const { data: rooms } = await adminClient
            .from('rooms')
            .select('*')
            .eq('status', 'available');

        if (!rooms || rooms.length === 0) {
            return NextResponse.json({ error: 'No available rooms to update' }, { status: 400 });
        }

        // Apply price change to rooms
        const priceChangePercent = insight.suggested_price_change || 0;
        const updatedRooms = [];

        for (const room of rooms) {
            const currentPrice = room.current_price || 100;
            const newPrice = currentPrice * (1 + priceChangePercent / 100);

            // Apply floor and ceiling limits
            const finalPrice = Math.max(floorPrice, Math.min(ceilingPrice, newPrice));

            updatedRooms.push({
                id: room.id,
                current_price: Number(finalPrice.toFixed(2)),
                last_logic_reason: `AI Insight: ${insight.title}`
            });

            // Log price change
            await adminClient.from('price_history').insert({
                room_id: room.id,
                old_price: currentPrice,
                new_price: finalPrice,
                reason: `AI Insight Approved: ${insight.title}`
            });
        }

        // Update room prices
        for (const roomUpdate of updatedRooms) {
            await adminClient
                .from('rooms')
                .update({
                    current_price: roomUpdate.current_price,
                    last_logic_reason: roomUpdate.last_logic_reason
                })
                .eq('id', roomUpdate.id);
        }

        // Mark insight as approved
        await adminClient
            .from('ai_insights')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', insightId);

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedRooms.length} rooms`,
            updatedRooms: updatedRooms.length
        });

    } catch (error: any) {
        console.error('Error approving insight:', error);
        return NextResponse.json({
            error: error.message || 'Failed to approve insight'
        }, { status: 500 });
    }
}
