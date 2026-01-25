import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/lib/email';

/**
 * Public API to create a booking
 * Also updates room status to occupied
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            room_id,
            check_in,
            check_out,
            guests,
            guest_name,
            guest_email,
            guest_phone,
            extras = [],
            notes,
            total_amount,
            calculated_breakdown
        } = body;

        // Validate required fields
        if (!room_id || !check_in || !check_out || !guest_name || !guest_email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get room and property details
        const { rows: rooms } = await sql`
            SELECT r.*, p.name as property_name, p.id as property_id
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

        // Check if room is available for these dates
        const { rows: conflicts } = await sql`
            SELECT id FROM bookings
            WHERE room_id = ${room_id}
            AND status IN ('confirmed', 'checked_in')
            AND (
                (check_in <= ${check_in} AND check_out > ${check_in})
                OR (check_in < ${check_out} AND check_out >= ${check_out})
                OR (check_in >= ${check_in} AND check_out <= ${check_out})
            )
        `;

        if (conflicts.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Room is not available for these dates' },
                { status: 409 }
            );
        }

        // Create the booking
        const { rows: newBooking } = await sql`
            INSERT INTO bookings (
                property_id,
                room_id,
                check_in,
                check_out,
                guest_name,
                guest_email,
                guest_phone,
                guests,
                total_amount,
                status,
                payment_status,
                source,
                notes,
                created_at
            ) VALUES (
                ${room.property_id},
                ${room_id},
                ${check_in},
                ${check_out},
                ${guest_name},
                ${guest_email},
                ${guest_phone || null},
                ${guests || 1},
                ${total_amount || 0},
                'confirmed',
                'pending',
                'direct',
                ${notes || null},
                NOW()
            )
            RETURNING id, check_in, check_out
        `;

        const booking = newBooking[0];

        // Store selected extras for this booking if any
        if (extras.length > 0 && calculated_breakdown?.extras) {
            for (const extra of calculated_breakdown.extras) {
                try {
                    await sql`
                        INSERT INTO booking_extras (
                            booking_id,
                            item_name,
                            price,
                            quantity
                        ) VALUES (
                            ${booking.id},
                            ${extra.name},
                            ${extra.price},
                            ${extra.quantity || 1}
                        )
                    `;
                } catch (e) {
                    // booking_extras table might not exist, that's okay
                    console.log('Could not save booking extras:', e);
                }
            }
        }

        // Update room status to occupied if booking starts today or is ongoing
        const today = new Date().toISOString().split('T')[0];
        if (check_in <= today && check_out > today) {
            await sql`
                UPDATE rooms SET status = 'occupied' WHERE id = ${room_id}
            `;
        }

        // Try to send confirmation email
        if (guest_email && process.env.RESEND_API_KEY) {
            try {
                // Calculate nights for email
                const startDate = new Date(check_in);
                const endDate = new Date(check_out);
                const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                await sendBookingConfirmation({
                    guestEmail: guest_email,
                    guestName: guest_name,
                    propertyName: room.property_name,
                    roomName: room.name,
                    checkIn: check_in,
                    checkOut: check_out,
                    totalPaid: total_amount || 0,
                    nights: nights,
                    bookingId: booking.id
                });
            } catch (emailError) {
                console.error('Failed to send booking email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Booking confirmed!',
            booking: {
                id: booking.id,
                roomId: room_id,
                roomName: room.name,
                propertyName: room.property_name,
                checkIn: booking.check_in,
                checkOut: booking.check_out,
                guestName: guest_name,
                guestEmail: guest_email,
                guests: guests || 1,
                totalAmount: total_amount,
                breakdown: calculated_breakdown,
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}
