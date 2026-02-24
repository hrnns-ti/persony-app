import type {
    RecurringEventException,
    ExceptionCreateInput,
    ExceptionUpdatePatch,
} from "../../types/calendar";
import { getCalendarDb } from "./database";

type ExceptionRow = {
    id: string;
    event_id: string;
    original_start: string;
    cancelled: number; // 0/1
    override_json: string | null;
    created_at: string;
    updated_at: string;
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

function rowToException(r: ExceptionRow): RecurringEventException {
    return {
        id: r.id,
        eventId: r.event_id,
        originalStart: r.original_start,
        // selalu boolean (optional di type tetap oke)
        cancelled: r.cancelled === 1,
        override: safeJson<any>(r.override_json),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

class ExceptionService {
    async getByEvent(eventId: string): Promise<RecurringEventException[]> {
        const db = await getCalendarDb();
        const rows = await db.select<ExceptionRow[]>(
            `SELECT * FROM calendar_event_exceptions
             WHERE event_id = ?
             ORDER BY original_start ASC`,
            [eventId]
        );
        return rows.map(rowToException);
    }

    async getForRange(
        rangeStart: string,
        rangeEnd: string,
        eventIds?: string[]
    ): Promise<RecurringEventException[]> {
        const db = await getCalendarDb();

        let rows: ExceptionRow[] = [];
        if (eventIds?.length) {
            const placeholders = eventIds.map(() => "?").join(",");
            rows = await db.select<ExceptionRow[]>(
                `SELECT * FROM calendar_event_exceptions
                 WHERE event_id IN (${placeholders})
                   AND original_start >= ?
                   AND original_start < ?
                 ORDER BY original_start ASC`,
                [...eventIds, rangeStart, rangeEnd]
            );
        } else {
            rows = await db.select<ExceptionRow[]>(
                `SELECT * FROM calendar_event_exceptions
                 WHERE original_start >= ?
                   AND original_start < ?
                 ORDER BY original_start ASC`,
                [rangeStart, rangeEnd]
            );
        }

        return rows.map(rowToException);
    }

    async add(data: ExceptionCreateInput): Promise<RecurringEventException> {
        const db = await getCalendarDb();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const created: RecurringEventException = {
            id,
            eventId: data.eventId,
            originalStart: data.originalStart,
            // default false kalau tidak diisi
            cancelled: !!data.cancelled,
            override: data.override,
            createdAt: now,
            updatedAt: now,
        };

        await db.execute(
            `INSERT INTO calendar_event_exceptions
             (id, event_id, original_start, cancelled, override_json, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?)`,
            [
                created.id,
                created.eventId,
                created.originalStart,
                created.cancelled ? 1 : 0,
                created.override ? JSON.stringify(created.override) : null,
                created.createdAt,
                created.updatedAt,
            ]
        );

        return created;
    }

    async update(
        id: string,
        patch: ExceptionUpdatePatch
    ): Promise<RecurringEventException | null> {
        const db = await getCalendarDb();
        const rows = await db.select<ExceptionRow[]>(
            `SELECT * FROM calendar_event_exceptions WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToException(rows[0]);

        // ✅ ini inti fix TS2367: tidak ada lagi `=== true`
        const nextCancelled = has(patch, "cancelled") ? !!patch.cancelled : !!current.cancelled;
        const nextOverride = has(patch, "override") ? (patch.override ?? undefined) : current.override;

        const updated: RecurringEventException = {
            ...current,
            cancelled: nextCancelled,
            override: nextOverride,
            updatedAt: new Date().toISOString(),
        };

        await db.execute(
            `UPDATE calendar_event_exceptions
             SET cancelled=?, override_json=?, updated_at=?
             WHERE id=?`,
            [
                updated.cancelled ? 1 : 0,
                updated.override ? JSON.stringify(updated.override) : null,
                updated.updatedAt,
                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getCalendarDb();
        await db.execute(`DELETE FROM calendar_event_exceptions WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getCalendarDb();
        await db.execute(`DELETE FROM calendar_event_exceptions`);
    }
}

export default new ExceptionService();