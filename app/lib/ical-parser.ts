export interface ICalEvent {
    uid: string;
    start: Date;
    end: Date;
    summary: string;
}

export function parseICS(icsContent: string): ICalEvent[] {
    const events: ICalEvent[] = [];
    const lines = icsContent.split(/\r\n|\n|\r/);

    let currentEvent: Partial<ICalEvent> | null = null;
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {};
            continue;
        }

        if (line === 'END:VEVENT') {
            if (inEvent && currentEvent && currentEvent.uid && currentEvent.start && currentEvent.end) {
                events.push(currentEvent as ICalEvent);
            }
            inEvent = false;
            currentEvent = null;
            continue;
        }

        if (inEvent && currentEvent) {
            if (line.startsWith('UID:')) {
                currentEvent.uid = line.substring(4);
            } else if (line.startsWith('DTSTART')) {
                currentEvent.start = parseICalDate(line);
            } else if (line.startsWith('DTEND')) {
                currentEvent.end = parseICalDate(line);
            } else if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.substring(8);
            }
        }
    }

    return events;
}

function parseICalDate(line: string): Date {
    // Format: DTSTART;VALUE=DATE:20240501 or DTSTART:20240501T120000Z
    const valuePart = line.split(':')[1];
    if (!valuePart) return new Date();

    const cleanValue = valuePart.replace('Z', '');

    // YYYYMMDD
    if (cleanValue.length === 8) {
        const y = parseInt(cleanValue.substring(0, 4));
        const m = parseInt(cleanValue.substring(4, 6)) - 1;
        const d = parseInt(cleanValue.substring(6, 8));
        return new Date(Date.UTC(y, m, d));
    }

    // YYYYMMDDThhmmss
    if (cleanValue.length >= 15) {
        const y = parseInt(cleanValue.substring(0, 4));
        const m = parseInt(cleanValue.substring(4, 6)) - 1;
        const d = parseInt(cleanValue.substring(6, 8));
        const h = parseInt(cleanValue.substring(9, 11));
        const min = parseInt(cleanValue.substring(11, 13));
        const s = parseInt(cleanValue.substring(13, 15));
        return new Date(Date.UTC(y, m, d, h, min, s));
    }

    return new Date();
}
