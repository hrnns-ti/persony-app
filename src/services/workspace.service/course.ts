import type { Course } from "../../types/workspace";
import { getWorkspaceDb } from "./database";

type CourseRow = {
    id: string;
    title: string;
    code: string;
    description: string | null;
    status: "active" | "completed" | "dropped";
    semester: string;
    start_date: string | null;
    end_date: string | null;
    instructor: string | null;
    credits: number | null;
    color: string | null;
    grade: string | null;
};

function has<T extends object>(obj: T, key: keyof any): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function toDate(v: unknown): Date | undefined {
    if (v === null || v === undefined) return undefined;
    const d = v instanceof Date ? v : new Date(v as any);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoOrNull(v: unknown): string | null {
    const d = toDate(v);
    return d ? d.toISOString() : null;
}

function rowToCourse(r: CourseRow): Course {
    return {
        id: r.id,
        title: r.title,
        code: r.code,
        description: r.description ?? undefined,
        status: r.status,
        semester: r.semester,
        startDate: r.start_date ? new Date(r.start_date) : undefined,
        endDate: r.end_date ? new Date(r.end_date) : undefined,
        credits: r.credits ?? undefined,
        color: r.color ?? undefined,
        grade: r.grade ?? undefined,
    };
}

class CourseService {
    async getAll(): Promise<Course[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<CourseRow[]>(
            `SELECT * FROM workspace_courses
       ORDER BY (start_date IS NULL) ASC, start_date DESC, title ASC`
        );
        return rows.map(rowToCourse);
    }

    async add(data: Omit<Course, "id">): Promise<Course> {
        const db = await getWorkspaceDb();
        const id = crypto.randomUUID();

        await db.execute(
            `INSERT INTO workspace_courses
       (id, title, code, description, status, semester, start_date, end_date, instructor, credits, color, grade)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.title,
                data.code,
                data.description ?? null,
                data.status,
                data.semester,
                toIsoOrNull(data.startDate),
                toIsoOrNull(data.endDate),
                data.credits ?? null,
                data.color ?? null,
                data.grade ?? null,
            ]
        );

        return { ...data, id };
    }

    async update(id: string, patch: Partial<Course>): Promise<Course | null> {
        const db = await getWorkspaceDb();
        const rows = await db.select<CourseRow[]>(
            `SELECT * FROM workspace_courses WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToCourse(rows[0]);

        const updated: Course = {
            ...current,
            ...patch,
            startDate: has(patch, "startDate") ? toDate((patch as any).startDate) : current.startDate,
            endDate: has(patch, "endDate") ? toDate((patch as any).endDate) : current.endDate,
            description: has(patch, "description") ? (patch.description ?? undefined) : current.description,
            credits: has(patch, "credits") ? (patch.credits ?? undefined) : current.credits,
            color: has(patch, "color") ? (patch.color ?? undefined) : current.color,
            grade: has(patch, "grade") ? (patch.grade ?? undefined) : current.grade,
        };

        await db.execute(
            `UPDATE workspace_courses
       SET title=?, code=?, description=?, status=?, semester=?,
           start_date=?, end_date=?, instructor=?, credits=?, color=?, grade=?
       WHERE id=?`,
            [
                updated.title,
                updated.code,
                updated.description ?? null,
                updated.status,
                updated.semester,
                toIsoOrNull(updated.startDate),
                toIsoOrNull(updated.endDate),
                updated.credits ?? null,
                updated.color ?? null,
                updated.grade ?? null,
                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_courses WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_courses`);
    }
}

export default new CourseService();
