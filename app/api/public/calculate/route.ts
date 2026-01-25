import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API to calculate booking price
 * Uses same logic as the Calculator page
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { room_id, check_in, check_out, guests, extras = [] } = body;

        if (!room_id || !check_in || !check_out) {
            return NextResponse.json(
                { success: false, error: 'room_id, check_in, and check_out are required' },
                { status: 400 }
            );
        }

        // Get room details
        const { rows: rooms } = await sql`
            SELECT r.*, p.currency
            FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE r.id = ${room_id}
        `;

        if (rooms.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        const room = rooms[0];

        // Calculate nights
        const startDate = new Date(check_in);
        const endDate = new Date(check_out);
        const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid date range' },
                { status: 400 }
            );
        }

        // Base price
        const basePrice = Number(room.base_price) || 0;
        let subtotal = basePrice * nights;

        // Weekend surcharge calculation
        let weekendNights = 0;
        const tempDate = new Date(startDate);
        while (tempDate < endDate) {
            const day = tempDate.getDay();
            if (day === 0 || day === 6) { // Sunday = 0, Saturday = 6
                weekendNights++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // Apply 20% weekend premium
        const weekendSurcharge = weekendNights * basePrice * 0.2;
        subtotal += weekendSurcharge;

        // Calculate extras total
        let extrasTotal = 0;
        const extraDetails: { name: string; price: number; quantity: number }[] = [];

        if (extras.length > 0) {
            // Get extras from database
            const { rows: roomExtras } = await sql`
                SELECT id, item_name, price
                FROM room_extras
                WHERE room_id = ${room_id}
            `;

            for (const extra of extras) {
                const foundExtra = roomExtras.find(e => e.id === extra.id);
                if (foundExtra) {
                    const quantity = extra.quantity || 1;
                    const extraPrice = Number(foundExtra.price) * quantity;
                    extrasTotal += extraPrice;
                    extraDetails.push({
                        name: foundExtra.item_name,
                        price: Number(foundExtra.price),
                        quantity
                    });
                }
            }
        }

        // Get taxes
        const { rows: taxes } = await sql`
            SELECT id, name, type, value, applies_to
            FROM taxes
            WHERE property_id = ${room.property_id} AND is_active = true
        `;

        let taxTotal = 0;
        const taxDetails: { name: string; amount: number }[] = [];
        const taxableAmount = subtotal + extrasTotal;

        for (const tax of taxes) {
            let taxAmount = 0;
            if (tax.type === 'percentage') {
                taxAmount = taxableAmount * (Number(tax.value) / 100);
            } else {
                taxAmount = Number(tax.value) * nights; // Flat rate per night
            }
            taxTotal += taxAmount;
            taxDetails.push({
                name: tax.name,
                amount: taxAmount
            });
        }

        const grandTotal = subtotal + extrasTotal + taxTotal;

        return NextResponse.json({
            success: true,
            calculation: {
                basePrice,
                nights,
                weekendNights,
                weekendSurcharge,
                subtotal,
                extras: extraDetails,
                extrasTotal,
                taxes: taxDetails,
                taxTotal,
                grandTotal,
                currency: room.currency || 'USD'
            }
        });

    } catch (error) {
        console.error('Error calculating price:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate price' },
            { status: 500 }
        );
    }
}
