import { parseICS } from './ical-parser';
import { sql } from '@vercel/postgres';

interface SyncResult {
    success: boolean;
    added: number;
    errors: string[];
}

export async function syncRoomIcal(roomId: string, icalUrl: string): Promise<SyncResult> {
    const errors: string[] = [];
    let added = 0;

    try {
        console.log(`Syncing iCal for room ${roomId} from ${icalUrl}`);
        const response = await fetch(icalUrl);
        if (!response.ok) throw new Error(`Failed to fetch iCal: ${response.statusText}`);

        const body = await response.text();
        const events = parseICS(body);

        for (const event of events) {
            try {
                const uid = event.uid;
                const start = event.start;
                const end = event.end;
                const summary = event.summary || 'External Booking';

                // Validate dates
                if (!start || !end) continue;
                if (end <= start) continue; // Invalid duration
                if (end < new Date()) continue; // Past booking (optional: maybe we want history?)

                // Check if exists
                const { rows: existing } = await sql`
                    SELECT id FROM bookings WHERE external_id = ${uid}
                `;

                if (existing.length === 0) {
                    // Insert new booking
                    // Note: We don't have guest email/phone, so we use placeholders or parsing from description
                    // Airbnb often puts guest name in summary "Reserved for John"

                    let guestName = 'External Guest';
                    if (summary.includes('Reserved for')) {
                        guestName = summary.replace('Reserved for', '').trim();
                    } else {
                        guestName = summary;
                    }

                    await sql`
                        INSERT INTO bookings (
                            room_id,
                            guest_name,
                            check_in,
                            check_out,
                            total_price,
                            status,
                            external_id,
                            source
                        ) VALUES (
                            ${roomId},
                            ${guestName},
                            ${start.toISOString()},
                            ${end.toISOString()},
                            0,
                            'confirmed',
                            ${uid},
                            'ical'
                        )
                    `;
                    added++;
                }
            } catch (e: any) {
                console.error('Error processing event:', e);
                errors.push(`Event ${event.uid}: ${e.message}`);
            }
        }

        return { success: true, added, errors };

    } catch (error: any) {
        console.error('Sync failed:', error);
        return { success: false, added: 0, errors: [error.message] };
    }
}
