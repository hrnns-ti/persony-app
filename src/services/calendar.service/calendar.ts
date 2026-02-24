import type {
    Calendar,
    CalendarCreateInput,
    CalendarUpdatePatch,
} from "../../types/calendar";
import { getCalendarDb } from "./database";

type CalendarRow = {
    id: string;
    title: string;
    color: string | null;
    visibility: "default" | "public" | "private";
    is_primary: number; // 0/1
    created_at: string;
    updated_at: string;
};

function has<T extends object>(obj: T, key: keyof any): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function rowToCalendar(r: CalendarRow): Calendar {
    return {
        id: r.id,
        title: r.title,
        color: r.color ?? undefined,
        visibility: r.visibility,
        isPrimary: r.is_primary === 1,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

class CalendarService {
    /** Seed default primary calendar kalau belum ada satupun */
    async ensureDefault(): Promise<Calendar> {
        const db = await getCalendarDb();
        const rows = await db.select<CalendarRow[]>(
            `SELECT * FROM calendar_calendars ORDER BY is_primary DESC, title ASC LIMIT 1`
        );

        if (rows.length) return rowToCalendar(rows[0]);

        // create default
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.execute(
            `INSERT INTO calendar_calendars
       (id, title, color, visibility, is_primary, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`,
            [id, "Personal", "#3b82f6", "default", 1, now, now]
        );

        return {
            id,
            title: "Personal",
            color: "#3b82f6",
            visibility: "default",
            isPrimary: true,
            createdAt: now,
            updatedAt: now,
        };
    }

    async getAll(): Promise<Calendar[]> {
        const db = await getCalendarDb();
        const rows = await db.select<CalendarRow[]>(
            `SELECT * FROM calendar_calendars
       ORDER BY is_primary DESC, title ASC`
        );
        return rows.map(rowToCalendar);
    }

    async add(data: CalendarCreateInput): Promise<Calendar> {
        const db = await getCalendarDb();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const created: Calendar = {
            id,
            title: data.title,
            color: data.color,
            visibility: data.visibility ?? "default",
            isPrimary: !!data.isPrimary,
            createdAt: now,
            updatedAt: now,
        };

        // kalau set primary=true, nonaktifkan primary lain
        if (created.isPrimary) {
            await db.execute(`UPDATE calendar_calendars SET is_primary = 0 WHERE is_primary = 1`);
        }

        await db.execute(
            `INSERT INTO calendar_calendars
       (id, title, color, visibility, is_primary, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`,
            [
                created.id,
                created.title,
                created.color ?? null,
                created.visibility ?? "default",
                created.isPrimary ? 1 : 0,
                created.createdAt,
                created.updatedAt,
            ]
        );

        return created;
    }

    async update(id: string, patch: CalendarUpdatePatch): Promise<Calendar | null> {
        const db = await getCalendarDb();
        const rows = await db.select<CalendarRow[]>(
            `SELECT * FROM calendar_calendars WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToCalendar(rows[0]);

        const updated: Calendar = {
            ...current,
            ...patch,
            color: has(patch, "color") ? (patch.color ?? undefined) : current.color,
            visibility: has(patch, "visibility")
                ? (patch.visibility ?? "default")
                : current.visibility,
            isPrimary: has(patch, "isPrimary") ? !!patch.isPrimary : current.isPrimary,
            updatedAt: new Date().toISOString(),
        };

        if (updated.isPrimary) {
            await db.execute(`UPDATE calendar_calendars SET is_primary = 0 WHERE id != ?`, [id]);
        }

        await db.execute(
            `UPDATE calendar_calendars
       SET title=?, color=?, visibility=?, is_primary=?, updated_at=?
       WHERE id=?`,
            [
                updated.title,
                updated.color ?? null,
                updated.visibility ?? "default",
                updated.isPrimary ? 1 : 0,
                updated.updatedAt,
                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getCalendarDb();
        await db.execute(`DELETE FROM calendar_calendars WHERE id = ?`, [id]);

        // kalau primary terhapus, promote 1 calendar jadi primary (biar UI aman)
        const remaining = await db.select<CalendarRow[]>(
            `SELECT * FROM calendar_calendars ORDER BY title ASC LIMIT 1`
        );
        if (remaining.length) {
            await db.execute(
                `UPDATE calendar_calendars SET is_primary = 1 WHERE id = ?`,
                [remaining[0].id]
            );
        }
    }

    async clear(): Promise<void> {
        const db = await getCalendarDb();
        await db.execute(`DELETE FROM calendar_calendars`);
    }
}

export default new CalendarService();