import ICAL from 'ical.js';

export interface CalendarEvent {
    uid: string;
    summary: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * iCal Parser for Airbnb, Vrbo, Booking.com calendars
 * Parses iCal feed and extracts booking events
 */
export class ICalParser {

    /**
     * Fetch and parse iCal feed from URL
     */
    static async parseFromUrl(icalUrl: string): Promise<CalendarEvent[]> {
        try {
            const response = await fetch(icalUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
            }

            const icalData = await response.text();
            return this.parseICalString(icalData);
        } catch (error) {
            console.error('Error fetching iCal feed:', error);
            throw error;
        }
    }

    /**
     * Parse iCal string data
     */
    static parseICalString(icalData: string): CalendarEvent[] {
        try {
            const jcalData = ICAL.parse(icalData);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents('vevent');

            const events: CalendarEvent[] = [];

            for (const vevent of vevents) {
                const event = new ICAL.Event(vevent);

                // Extract event details
                const uid = event.uid || `generated-${Date.now()}-${Math.random()}`;
                const summary = event.summary || 'Blocked';
                const description = event.description || '';

                // Get dates
                const startDate = event.startDate?.toJSDate();
                const endDate = event.endDate?.toJSDate();

                if (!startDate || !endDate) {
                    console.warn('Skipping event without dates:', uid);
                    continue;
                }

                // Determine status
                let status: 'confirmed' | 'tentative' | 'cancelled' = 'confirmed';
                const statusProp = vevent.getFirstPropertyValue('status');
                if (statusProp) {
                    const statusStr = statusProp.toLowerCase();
                    if (statusStr === 'tentative') status = 'tentative';
                    if (statusStr === 'cancelled') status = 'cancelled';
                }

                events.push({
                    uid,
                    summary,
                    description,
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    status
                });
            }

            return events;
        } catch (error) {
            console.error('Error parsing iCal data:', error);
            throw new Error('Failed to parse iCal data');
        }
    }

    /**
     * Detect calendar platform from URL or summary
     */
    static detectPlatform(url: string, summary?: string): string {
        if (url.includes('airbnb.com')) return 'airbnb';
        if (url.includes('vrbo.com') || url.includes('homeaway.com')) return 'vrbo';
        if (url.includes('booking.com')) return 'booking_com';
        if (summary?.toLowerCase().includes('airbnb')) return 'airbnb';
        if (summary?.toLowerCase().includes('vrbo')) return 'vrbo';
        return 'other';
    }

    /**
     * Check if event conflicts with existing bookings
     */
    static hasConflict(
        newEvent: CalendarEvent,
        existingBookings: { check_in: string; check_out: string; }[]
    ): boolean {
        const newStart = new Date(newEvent.startDate);
        const newEnd = new Date(newEvent.endDate);

        for (const booking of existingBookings) {
            const existStart = new Date(booking.check_in);
            const existEnd = new Date(booking.check_out);

            // Check for overlap
            if (
                (newStart >= existStart && newStart < existEnd) ||
                (newEnd > existStart && newEnd <= existEnd) ||
                (newStart <= existStart && newEnd >= existEnd)
            ) {
                return true; // Conflict detected
            }
        }

        return false; // No conflict
    }
}
