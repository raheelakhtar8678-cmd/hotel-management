/**
 * Email Notification System
 * Uses Resend API for sending transactional emails
 * 
 * Free tier: 3,000 emails/month
 * Setup: Add RESEND_API_KEY to environment variables
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface BookingEmailData {
    guestName: string;
    guestEmail: string;
    propertyName: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    totalPaid: number;
    nights: number;
    bookingId: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.log('Email not sent: RESEND_API_KEY not configured');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: options.from || 'YieldVibe <notifications@resend.dev>',
                to: options.to,
                subject: options.subject,
                html: options.html
            })
        });

        if (response.ok) {
            return { success: true };
        } else {
            const error = await response.text();
            console.error('Email send failed:', error);
            return { success: false, error: 'Failed to send email' };
        }
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: 'Email service error' };
    }
}

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<{ success: boolean; error?: string }> {
    const html = getBookingConfirmationTemplate(data);

    return sendEmail({
        to: data.guestEmail,
        subject: `Booking Confirmed - ${data.propertyName}`,
        html
    });
}

/**
 * Send booking notification to property owner
 */
export async function sendOwnerNotification(data: BookingEmailData, ownerEmail: string): Promise<{ success: boolean; error?: string }> {
    const html = getOwnerNotificationTemplate(data);

    return sendEmail({
        to: ownerEmail,
        subject: `New Booking Received - ${data.guestName}`,
        html
    });
}

// ============================================
// Email Templates
// ============================================

function getBookingConfirmationTemplate(data: BookingEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0066cc 0%, #2dd4bf 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! ✓</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your reservation is all set</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="font-size: 16px; color: #334155;">Hi <strong>${data.guestName}</strong>,</p>
            <p style="color: #64748b; line-height: 1.6;">
                Thank you for your reservation! We're excited to host you at <strong>${data.propertyName}</strong>.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0066cc;">
                <h3 style="margin: 0 0 15px; color: #0066cc; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reservation Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Property</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.propertyName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Room</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.roomName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Check-in</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.checkIn}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Check-out</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.checkOut}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Duration</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.nights} night${data.nights > 1 ? 's' : ''}</td>
                    </tr>
                    <tr style="border-top: 1px dashed #e2e8f0;">
                        <td style="padding: 12px 0 8px; color: #64748b; font-weight: 600;">Total Paid</td>
                        <td style="padding: 12px 0 8px; text-align: right; font-weight: 700; color: #0066cc; font-size: 18px;">$${data.totalPaid.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                Confirmation #: <strong>${data.bookingId.slice(0, 8).toUpperCase()}</strong>
            </p>
            
            <p style="color: #64748b; line-height: 1.6;">
                If you have any questions, please don't hesitate to reach out.
            </p>
            
            <p style="color: #334155; margin-top: 20px;">
                See you soon!<br>
                <strong>The ${data.propertyName} Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Powered by YieldVibe Property Management
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

function getOwnerNotificationTemplate(data: BookingEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: #0066cc; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📬 New Booking Received</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 25px;">
            <p style="font-size: 15px; color: #334155;">
                You have a new booking at <strong>${data.propertyName}</strong>!
            </p>
            
            <!-- Guest Info -->
            <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 4px solid #22c55e;">
                <h4 style="margin: 0 0 10px; color: #166534;">Guest Information</h4>
                <p style="margin: 5px 0; color: #334155;"><strong>${data.guestName}</strong></p>
                <p style="margin: 5px 0; color: #64748b;">${data.guestEmail}</p>
            </div>
            
            <!-- Booking Details -->
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Room:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.roomName}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Check-in:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.checkIn}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Check-out:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.checkOut}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Nights:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.nights}</td>
                </tr>
                <tr style="border-top: 2px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #0066cc; font-weight: 700;">Revenue:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0066cc; font-size: 18px;">$${data.totalPaid.toFixed(2)}</td>
                </tr>
            </table>
            
            <p style="color: #94a3b8; font-size: 12px;">
                Booking ID: ${data.bookingId.slice(0, 8).toUpperCase()}
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
}
