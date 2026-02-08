import type { Note } from "../../types/workspace";
import { getWorkspaceDb } from "./database";

type NoteRow = {
    id: string;
    course_id: string | null;
    course_name: string | null;
    title: string;
    tags: string; // JSON array
    content: string;
    file_path: string | null;
    is_pinned: number | null;
    created_at: string;
    updated_at: string;
};

function has<T extends object>(obj: T, key: keyof any): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function safeJsonArray(v: string): string[] {
    try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
}

function rowToNote(r: NoteRow): Note {
    return {
        id: r.id,
        courseId: r.course_id ?? undefined,
        courseName: r.course_name ?? undefined,
        title: r.title,
        tags: safeJsonArray(r.tags),
        content: r.content,
        filePath: r.file_path ?? undefined,
        isPinned: r.is_pinned ? true : false,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
    };
}

class NoteService {
    async getAll(): Promise<Note[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<NoteRow[]>(
            `SELECT * FROM workspace_notes
       ORDER BY (is_pinned IS NULL OR is_pinned=0) ASC, updated_at DESC`
        );
        return rows.map(rowToNote);
    }

    async getByCourse(courseId: string): Promise<Note[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<NoteRow[]>(
            `SELECT * FROM workspace_notes
       WHERE course_id = ?
       ORDER BY (is_pinned IS NULL OR is_pinned=0) ASC, updated_at DESC`,
            [courseId]
        );
        return rows.map(rowToNote);
    }

    async add(data: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note> {
        const db = await getWorkspaceDb();
        const id = crypto.randomUUID();
        const nowIso = new Date().toISOString();

        await db.execute(
            `INSERT INTO workspace_notes
       (id, course_id, course_name, title, tags, content, file_path, is_pinned, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.courseId ?? null,
                data.courseName ?? null,
                data.title,
                JSON.stringify(data.tags ?? []),
                data.content,
                data.filePath ?? null,
                data.isPinned ? 1 : 0,
                nowIso,
                nowIso,
            ]
        );

        return {
            ...data,
            id,
            tags: data.tags ?? [],
            createdAt: new Date(nowIso),
            updatedAt: new Date(nowIso),
        };
    }

    async update(id: string, patch: Partial<Note>): Promise<Note | null> {
        const db = await getWorkspaceDb();
        const rows = await db.select<NoteRow[]>(
            `SELECT * FROM workspace_notes WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToNote(rows[0]);
        const updatedAtIso = new Date().toISOString();

        const updated: Note = {
            ...current,
            ...patch,
            courseId: has(patch, "courseId") ? (patch.courseId ?? undefined) : current.courseId,
            courseName: has(patch, "courseName") ? (patch.courseName ?? undefined) : current.courseName,
            filePath: has(patch, "filePath") ? (patch.filePath ?? undefined) : current.filePath,
            isPinned: has(patch, "isPinned") ? !!patch.isPinned : current.isPinned,
            tags: has(patch, "tags") ? (patch.tags ?? []) : current.tags,
            updatedAt: new Date(updatedAtIso),
            createdAt: current.createdAt,
        };

        await db.execute(
            `UPDATE workspace_notes
       SET course_id=?, course_name=?, title=?, tags=?, content=?, file_path=?,
           is_pinned=?, updated_at=?
       WHERE id=?`,
            [
                updated.courseId ?? null,
                updated.courseName ?? null,
                updated.title,
                JSON.stringify(updated.tags ?? []),
                updated.content,
                updated.filePath ?? null,
                updated.isPinned ? 1 : 0,
                updatedAtIso,
                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_notes WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_notes`);
    }
}

export default new NoteService();
