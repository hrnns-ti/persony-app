import type {
    CalendarEvent,
    EventCreateInput,
    EventUpdatePatch,
    Reminder,
    RecurrenceRule,
    Attendee,
} from "../../types/calendar";
import { getCalendarDb } from "./database";

type EventRow = {
    id: string;
    calendar_id: string;

    title: string;
    description: string | null;
    location: string | null;

    start: string;
    end: string;
    all_day: number;
    timezone: string | null;

    status: "confirmed" | "tentative" | "cancelled";
    visibility: "default" | "public" | "private";
    transparency: "opaque" | "transparent";

    color: string | null;

    recurrence_json: string | null;
    attendees_json: string | null;
    meeting_url: string | null;

    created_at: string;
    updated_at: string;
};

type ReminderRow = {
    id: string;
    event_id: string;
    method: "popup" | "email";
    minutes_before: number;
};

function has<T extends object>(obj: T, key: keyof any): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function safeJson<T>(v: string | null): T | undefined {
    if (!v) return undefined;
    try {
        return JSON.parse(v) as T;
    } catch {
        return undefined;
    }
}

function toIso(v: unknown): string {
    if (typeof v === "string") return v;
    if (v instanceof Date) return v.toISOString();
    return new Date(v as any).toISOString();
}

function rowToEvent(r: EventRow, reminders?: Reminder[]): CalendarEvent {
    return {
        id: r.id,
        calendarId: r.calendar_id,

        title: r.title,
        description: r.description ?? undefined,
        location: r.location ?? undefined,

        start: r.start,
        end: r.end,
        allDay: r.all_day === 1,
        timezone: r.timezone ?? undefined,

        status: r.status,
        visibility: r.visibility,
        transparency: r.transparency,

        color: r.color ?? undefined,
        recurrence: safeJson<RecurrenceRule>(r.recurrence_json),
        attendees: safeJson<Attendee[]>(r.attendees_json),
        meetingUrl: r.meeting_url ?? undefined,

        reminders: reminders ?? undefined,

        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

async function loadRemindersMap(eventIds: string[]): Promise<Map<string, Reminder[]>> {
    const map = new Map<string, Reminder[]>();
    if (!eventIds.length) return map;

    const db = await getCalendarDb();
    const placeholders = eventIds.map(() => "?").join(",");
    const rows = await db.select<ReminderRow[]>(
        `SELECT * FROM calendar_event_reminders WHERE event_id IN (${placeholders})`,
        eventIds
    );

    for (const r of rows) {
        const item: Reminder = { method: r.method, minutesBefore: r.minutes_before };
        const arr = map.get(r.event_id) ?? [];
        arr.push(item);
        map.set(r.event_id, arr);
    }

    // consistent order
    for (const [k, arr] of map.entries()) {
        arr.sort((a, b) => a.minutesBefore - b.minutesBefore);
        map.set(k, arr);
    }

    return map;
}

async function replaceReminders(eventId: string, reminders?: Reminder[]): Promise<void> {
    const db = await getCalendarDb();
    await db.execute(`DELETE FROM calendar_event_reminders WHERE event_id = ?`, [eventId]);

    if (!reminders?.length) return;

    for (const r of reminders) {
        await db.execute(
            `INSERT INTO calendar_event_reminders (id, event_id, method, minutes_before)
       VALUES (?,?,?,?)`,
            [crypto.randomUUID(), eventId, r.method, r.minutesBefore]
        );
    }
}

class EventService {
    async getAll(): Promise<CalendarEvent[]> {
        const db = await getCalendarDb();
        const rows = await db.select<EventRow[]>(
            `SELECT * FROM calendar_events ORDER BY start ASC`
        );

        const ids = rows.map((x) => x.id);
        const remindersMap = await loadRemindersMap(ids);

        return rows.map((r) => rowToEvent(r, remindersMap.get(r.id)));
    }

    async getByCalendar(calendarId: string): Promise<CalendarEvent[]> {
        const db = await getCalendarDb();
        const rows = await db.select<EventRow[]>(
            `SELECT * FROM calendar_events WHERE calendar_id = ? ORDER BY start ASC`,
            [calendarId]
        );

        const ids = rows.map((x) => x.id);
        const remindersMap = await loadRemindersMap(ids);

        return rows.map((r) => rowToEvent(r, remindersMap.get(r.id)));
    }

    /**
     * Untuk tampilan week/month:
     * - event non-recurring: harus overlap range
     * - event recurring: kita include semua series (nanti difilter di recurrence expander)
     */
    async getForRange(rangeStart: string, rangeEnd: string, calendarIds?: string[]): Promise<CalendarEvent[]> {
        const db = await getCalendarDb();

        const baseWhere = `
      (
        recurrence_json IS NOT NULL
        OR (start < ? AND end > ?)
      )
    `;

        let rows: EventRow[] = [];

        if (calendarIds?.length) {
            const placeholders = calendarIds.map(() => "?").join(",");
            rows = await db.select<EventRow[]>(
                `SELECT * FROM calendar_events
         WHERE calendar_id IN (${placeholders})
           AND ${baseWhere}
         ORDER BY start ASC`,
                [...calendarIds, rangeEnd, rangeStart]
            );
        } else {
            rows = await db.select<EventRow[]>(
                `SELECT * FROM calendar_events
         WHERE ${baseWhere}
         ORDER BY start ASC`,
                [rangeEnd, rangeStart]
            );
        }

        const ids = rows.map((x) => x.id);
        const remindersMap = await loadRemindersMap(ids);

        return rows.map((r) => rowToEvent(r, remindersMap.get(r.id)));
    }

    async add(data: EventCreateInput): Promise<CalendarEvent> {
        const db = await getCalendarDb();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const created: CalendarEvent = {
            id,
            calendarId: data.calendarId,

            title: data.title,
            description: data.description,
            location: data.location,

            start: toIso(data.start),
            end: toIso(data.end),
            allDay: !!data.allDay,
            timezone: data.timezone,

            status: data.status ?? "confirmed",
            visibility: data.visibility ?? "default",
            transparency: data.transparency ?? "opaque",

            color: data.color,
            recurrence: data.recurrence,
            attendees: data.attendees,
            meetingUrl: data.meetingUrl,

            reminders: data.reminders,

            createdAt: now,
            updatedAt: now,
        };

        await db.execute(
            `INSERT INTO calendar_events
       (id, calendar_id, title, description, location,
        start, end, all_day, timezone,
        status, visibility, transparency,
        color, recurrence_json, attendees_json, meeting_url,
        created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                created.id,
                created.calendarId,
                created.title,
                created.description ?? null,
                created.location ?? null,
                created.start,
                created.end,
                created.allDay ? 1 : 0,
                created.timezone ?? null,
                created.status,
                created.visibility ?? "default",
                created.transparency ?? "opaque",
                created.color ?? null,
                created.recurrence ? JSON.stringify(created.recurrence) : null,
                created.attendees ? JSON.stringify(created.attendees) : null,
                created.meetingUrl ?? null,
                created.createdAt,
                created.updatedAt,
            ]
        );

        await replaceReminders(created.id, created.reminders);

        return created;
    }

    async update(id: string, patch: EventUpdatePatch): Promise<CalendarEvent | null> {
        const db = await getCalendarDb();
        const rows = await db.select<EventRow[]>(
            `SELECT * FROM calendar_events WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        // load reminders current (biar merge aman kalau patch tidak bawa reminders)
        const remindersMap = await loadRemindersMap([id]);
        const current = rowToEvent(rows[0], remindersMap.get(id));

        const updated: CalendarEvent = {
            ...current,
            ...patch,

            description: has(patch, "description") ? (patch.description ?? undefined) : current.description,
            location: has(patch, "location") ? (patch.location ?? undefined) : current.location,
            timezone: has(patch, "timezone") ? (patch.timezone ?? undefined) : current.timezone,

            start: has(patch, "start") ? toIso((patch as any).start) : current.start,
            end: has(patch, "end") ? toIso((patch as any).end) : current.end,

            allDay: has(patch, "allDay") ? !!patch.allDay : current.allDay,

            visibility: has(patch, "visibility") ? (patch.visibility ?? "default") : current.visibility,
            status: has(patch, "status") ? (patch.status ?? current.status) : current.status,
            transparency: has(patch, "transparency") ? (patch.transparency ?? "opaque") : current.transparency,

            color: has(patch, "color") ? (patch.color ?? undefined) : current.color,
            recurrence: has(patch, "recurrence") ? (patch.recurrence ?? undefined) : current.recurrence,
            attendees: has(patch, "attendees") ? (patch.attendees ?? undefined) : current.attendees,
            meetingUrl: has(patch, "meetingUrl") ? (patch.meetingUrl ?? undefined) : current.meetingUrl,

            reminders: has(patch, "reminders") ? (patch.reminders ?? undefined) : current.reminders,

            updatedAt: new Date().toISOString(),
        };

        await db.execute(
            `UPDATE calendar_events
       SET title=?, description=?, location=?,
           start=?, end=?, all_day=?, timezone=?,
           status=?, visibility=?, transparency=?,
           color=?, recurrence_json=?, attendees_json=?, meeting_url=?,
           updated_at=?
       WHERE id=?`,
            [
                updated.title,
                updated.description ?? null,
                updated.location ?? null,
                updated.start,
                updated.end,
                updated.allDay ? 1 : 0,
                updated.timezone ?? null,
                updated.status,
                updated.visibility ?? "default",
                updated.transparency ?? "opaque",
                updated.color ?? null,
                updated.recurrence ? JSON.stringify(updated.recurrence) : null,
                updated.attendees ? JSON.stringify(updated.attendees) : null,
                updated.meetingUrl ?? null,
                updated.updatedAt,
                id,
            ]
        );

        // Replace reminders only if patch contains reminders (atau kamu bisa always replace)
        if (has(patch, "reminders")) {
            await replaceReminders(id, updated.reminders);
        }

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getCalendarDb();
        await db.execute(`DELETE FROM calendar_events WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getCalendarDb();
        await db.execute(`DELETE FROM calendar_events`);
    }
}

export default new EventService();