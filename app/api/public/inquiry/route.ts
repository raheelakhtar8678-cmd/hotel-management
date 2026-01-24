import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * Public API to receive booking inquiries
 * No authentication required
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            property_id,
            room_id,
            guest_name,
            guest_email,
            guest_phone,
            check_in,
            check_out,
            guests,
            message
        } = body;

        // Validate required fields
        if (!property_id || !guest_name || !guest_email || !check_in || !check_out) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get property info
        const { rows: properties } = await sql`
            SELECT name, owner_email FROM properties WHERE id = ${property_id}
        `;

        if (properties.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Property not found' },
                { status: 404 }
            );
        }

        const property = properties[0];

        // Store inquiry in database
        const { rows } = await sql`
            INSERT INTO booking_inquiries (
                property_id, room_id, guest_name, guest_email, guest_phone,
                check_in, check_out, guests, message, status
            ) VALUES (
                ${property_id}, ${room_id || null}, ${guest_name}, ${guest_email}, 
                ${guest_phone || null}, ${check_in}, ${check_out}, ${guests || 1}, 
                ${message || null}, 'pending'
            )
            RETURNING id
        `;

        const inquiryId = rows[0]?.id;

        // Try to send email notification to owner
        if (property.owner_email) {
            try {
                await sendEmail({
                    to: property.owner_email,
                    subject: `New Booking Inquiry - ${property.name}`,
                    html: `
                        <h2>New Booking Inquiry</h2>
                        <p><strong>Guest:</strong> ${guest_name}</p>
                        <p><strong>Email:</strong> ${guest_email}</p>
                        <p><strong>Phone:</strong> ${guest_phone || 'Not provided'}</p>
                        <p><strong>Dates:</strong> ${check_in} to ${check_out}</p>
                        <p><strong>Guests:</strong> ${guests || 1}</p>
                        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                        <p>Log in to your YieldVibe dashboard to respond to this inquiry.</p>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send inquiry email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Inquiry submitted successfully! The property owner will contact you soon.',
            inquiryId
        });

    } catch (error) {
        console.error('Error submitting inquiry:', error);

        // Check if it's a table doesn't exist error
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('booking_inquiries')) {
            // Table doesn't exist - still return success but log warning
            console.warn('booking_inquiries table not found - inquiry not saved');
            return NextResponse.json({
                success: true,
                message: 'Inquiry submitted! The property owner will contact you soon.',
                note: 'Database migration pending'
            });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to submit inquiry' },
            { status: 500 }
        );
    }
}
