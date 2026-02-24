import type { CalendarEvent, EventInstance, RecurringEventException } from "../../types/calendar";

/**
 * MVP stub:
 * - Non-recurring: jadi 1 instance
 * - Recurring: return [] dulu (nanti kita implement RRULE expander)
 */
export function expandEventsToInstances(
    events: CalendarEvent[],
    _exceptions: RecurringEventException[],
    rangeStart: string,
    rangeEnd: string
): EventInstance[] {
    const startMs = new Date(rangeStart).getTime();
    const endMs = new Date(rangeEnd).getTime();

    const instances: EventInstance[] = [];

    for (const e of events) {
        if (e.recurrence) {
            // TODO: implement RRULE expansion + apply exception
            continue;
        }

        const s = new Date(e.start).getTime();
        const en = new Date(e.end).getTime();

        // overlap check: start < rangeEnd && end > rangeStart
        if (s < endMs && en > startMs) {
            instances.push({
                instanceId: e.id,
                eventId: e.id,
                calendarId: e.calendarId,
                title: e.title,
                description: e.description,
                location: e.location,
                start: e.start,
                end: e.end,
                allDay: e.allDay,
                timezone: e.timezone,
                status: e.status,
                visibility: e.visibility,
                transparency: e.transparency,
                color: e.color,
                isRecurring: false,
            });
        }
    }

    return instances.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}