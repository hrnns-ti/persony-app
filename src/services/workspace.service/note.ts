import type { Note } from "../../types/workspace"
import { getWorkspaceDb } from "./database"

type NoteRow = {
    id: string
    course_id: string | null
    course_name: string | null

    // ✅ NEW
    project_id: string | null
    project_name: string | null

    title: string
    tags: string
    content: string
    file_path: string | null
    is_pinned: number | null
    created_at: string
    updated_at: string
}

type ColumnInfo = { name: string }

function has<T extends object>(obj: T, key: keyof any): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key)
}

function safeJsonArray(v: string): string[] {
    try {
        const parsed = JSON.parse(v)
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
    } catch {
        return []
    }
}

function rowToNote(r: NoteRow): Note {
    return {
        id: r.id,
        courseId: r.course_id ?? undefined,
        courseName: r.course_name ?? undefined,

        // ✅ NEW
        projectId: r.project_id ?? undefined,
        projectName: r.project_name ?? undefined,

        title: r.title ?? "Untitled",
        tags: safeJsonArray(r.tags),
        content: r.content ?? "",
        filePath: r.file_path ?? undefined,
        isPinned: !!r.is_pinned,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
    }
}

function makeId() {
    const c: any = globalThis.crypto
    if (c?.randomUUID) return c.randomUUID()
    return `note_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

class NoteService {
    private schemaReady = false

    private async ensureSchema() {
        if (this.schemaReady) return
        const db = await getWorkspaceDb()

        const cols = await db.select<ColumnInfo[]>(`PRAGMA table_info(workspace_notes)`)
        const names = new Set(cols.map((c) => c.name))

        if (!names.has("project_id")) {
            await db.execute(`ALTER TABLE workspace_notes ADD COLUMN project_id TEXT`)
        }
        if (!names.has("project_name")) {
            await db.execute(`ALTER TABLE workspace_notes ADD COLUMN project_name TEXT`)
        }

        this.schemaReady = true
    }

    async getAll(): Promise<Note[]> {
        await this.ensureSchema()
        const db = await getWorkspaceDb()
        const rows = await db.select<NoteRow[]>(
            `SELECT * FROM workspace_notes
             ORDER BY (is_pinned IS NULL OR is_pinned=0) ASC, updated_at DESC`
        )
        return rows.map(rowToNote)
    }

    async getByCourse(courseId: string): Promise<Note[]> {
        await this.ensureSchema()
        const db = await getWorkspaceDb()
        const rows = await db.select<NoteRow[]>(
            `SELECT * FROM workspace_notes
             WHERE course_id = ?
             ORDER BY (is_pinned IS NULL OR is_pinned=0) ASC, updated_at DESC`,
            [courseId]
        )
        return rows.map(rowToNote)
    }

    async getById(id: string): Promise<Note | null> {
        await this.ensureSchema()
        const db = await getWorkspaceDb()
        const rows = await db.select<NoteRow[]>(`SELECT * FROM workspace_notes WHERE id = ?`, [id])
        return rows.length ? rowToNote(rows[0]) : null
    }

    async add(data: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note> {
        await this.ensureSchema()
        const db = await getWorkspaceDb()
        const id = makeId()
        const nowIso = new Date().toISOString()

        const title = data.title ?? "Untitled"
        const tags = data.tags ?? []
        const content = data.content ?? ""
        const isPinned = !!data.isPinned

        await db.execute(
            `INSERT INTO workspace_notes
       (id, course_id, course_name, project_id, project_name, title, tags, content, file_path, is_pinned, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.courseId ?? null,
                data.courseName ?? null,
                data.projectId ?? null,
                data.projectName ?? null,
                title,
                JSON.stringify(tags),
                content,
                data.filePath ?? null,
                isPinned ? 1 : 0,
                nowIso,
                nowIso,
            ]
        )

        return {
            ...data,
            id,
            title,
            tags,
            content,
            isPinned,
            createdAt: new Date(nowIso),
            updatedAt: new Date(nowIso),
        }
    }

    async update(id: string, patch: Partial<Note>): Promise<Note | null> {
        await this.ensureSchema()
        const db = await getWorkspaceDb()
        const rows = await db.select<NoteRow[]>(`SELECT * FROM workspace_notes WHERE id = ?`, [id])
        if (!rows.length) return null

        const current = rowToNote(rows[0])
        const updatedAtIso = new Date().toISOString()

        const updated: Note = {
            ...current,
            ...patch,
            courseId: has(patch, "courseId") ? (patch.courseId ?? undefined) : current.courseId,
            courseName: has(patch, "courseName") ? (patch.courseName ?? undefined) : current.courseName,

            // ✅ NEW
            projectId: has(patch, "projectId") ? (patch.projectId ?? undefined) : current.projectId,
            projectName: has(patch, "projectName") ? (patch.projectName ?? undefined) : current.projectName,

            filePath: has(patch, "filePath") ? (patch.filePath ?? undefined) : current.filePath,
            isPinned: has(patch, "isPinned") ? !!patch.isPinned : current.isPinned,
            tags: has(patch, "tags") ? (patch.tags ?? []) : current.tags,
            title: has(patch, "title") ? (patch.title ?? current.title) : current.title,
            content: has(patch, "content") ? (patch.content ?? "") : current.content,
            updatedAt: new Date(updatedAtIso),
            createdAt: current.createdAt,
        }

        await db.execute(
            `UPDATE workspace_notes
             SET course_id=?, course_name=?, project_id=?, project_name=?,
                 title=?, tags=?, content=?, file_path=?, is_pinned=?, updated_at=?
             WHERE id=?`,
            [
                updated.courseId ?? null,
                updated.courseName ?? null,
                updated.projectId ?? null,
                updated.projectName ?? null,
                updated.title,
                JSON.stringify(updated.tags ?? []),
                updated.content ?? "",
                updated.filePath ?? null,
                updated.isPinned ? 1 : 0,
                updatedAtIso,
                id,
            ]
        )

        return updated
    }

    async remove(id: string): Promise<void> {
        await this.ensureSchema()
        const db = await getWorkspaceDb()
        await db.execute(`DELETE FROM workspace_notes WHERE id = ?`, [id])
    }
}

const noteService = new NoteService()
export { noteService }
export default noteService
