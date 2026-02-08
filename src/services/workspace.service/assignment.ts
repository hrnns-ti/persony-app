import type { Assignment } from "../../types/workspace";
import { getWorkspaceDb } from "./database";

type AssignmentRow = {
    id: string;
    title: string;
    course_id: string;
    course_name: string;
    description: string | null;
    assignment_status: "pending" | "submitted" | "graded";
    type: "exam" | "practice" | "assignment";
    priority: "low" | "medium" | "high";
    deadline: string;
    repo_url: string | null;
    submitted_at: string | null;
    feedback: string | null;
    attachments: string | null; // JSON
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

function safeJsonArray(v: string | null): string[] | undefined {
    if (!v) return undefined;
    try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : undefined;
    } catch {
        return undefined;
    }
}

function rowToAssignment(r: AssignmentRow): Assignment {
    return {
        id: r.id,
        title: r.title,
        courseId: r.course_id,
        courseName: r.course_name,
        description: r.description ?? undefined,
        assignmentStatus: r.assignment_status,
        type: r.type,
        priority: r.priority,
        deadline: new Date(r.deadline),
        repoUrl: r.repo_url ?? undefined,
        submittedAt: r.submitted_at ? new Date(r.submitted_at) : undefined,
        feedback: r.feedback ?? undefined,
        attachments: safeJsonArray(r.attachments),
    };
}

class AssignmentService {
    async getAll(): Promise<Assignment[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<AssignmentRow[]>(
            `SELECT * FROM workspace_assignments ORDER BY deadline ASC`
        );
        return rows.map(rowToAssignment);
    }

    async getByCourse(courseId: string): Promise<Assignment[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<AssignmentRow[]>(
            `SELECT * FROM workspace_assignments WHERE course_id = ? ORDER BY deadline ASC`,
            [courseId]
        );
        return rows.map(rowToAssignment);
    }

    async add(data: Omit<Assignment, "id" | "submittedAt">): Promise<Assignment> {
        const db = await getWorkspaceDb();
        const id = crypto.randomUUID();

        await db.execute(
            `INSERT INTO workspace_assignments
       (id, title, course_id, course_name, description, assignment_status, type, priority, deadline,
        repo_url, submitted_at, feedback, attachments)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.title,
                data.courseId,
                data.courseName,
                data.description ?? null,
                data.assignmentStatus,
                data.type,
                data.priority,
                toIsoOrNull(data.deadline)!, // deadline wajib
                data.repoUrl ?? null,
                null,
                data.feedback ?? null,
                data.attachments ? JSON.stringify(data.attachments) : null,
            ]
        );

        return { ...data, id, submittedAt: undefined };
    }

    async update(id: string, patch: Partial<Assignment>): Promise<Assignment | null> {
        const db = await getWorkspaceDb();
        const rows = await db.select<AssignmentRow[]>(
            `SELECT * FROM workspace_assignments WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToAssignment(rows[0]);

        const updated: Assignment = {
            ...current,
            ...patch,
            deadline: has(patch, "deadline") ? (toDate((patch as any).deadline) ?? current.deadline) : current.deadline,
            submittedAt: has(patch, "submittedAt") ? toDate((patch as any).submittedAt) : current.submittedAt,
            description: has(patch, "description") ? (patch.description ?? undefined) : current.description,
            repoUrl: has(patch, "repoUrl") ? (patch.repoUrl ?? undefined) : current.repoUrl,
            feedback: has(patch, "feedback") ? (patch.feedback ?? undefined) : current.feedback,
            attachments: has(patch, "attachments") ? (patch.attachments ?? undefined) : current.attachments,
        };

        await db.execute(
            `UPDATE workspace_assignments
       SET title=?, course_id=?, course_name=?, description=?,
           assignment_status=?, type=?, priority=?, deadline=?,
           repo_url=?, submitted_at=?, feedback=?, attachments=?
       WHERE id=?`,
            [
                updated.title,
                updated.courseId,
                updated.courseName,
                updated.description ?? null,
                updated.assignmentStatus,
                updated.type,
                updated.priority,
                updated.deadline.toISOString(),
                updated.repoUrl ?? null,
                updated.submittedAt ? updated.submittedAt.toISOString() : null,
                updated.feedback ?? null,
                updated.attachments ? JSON.stringify(updated.attachments) : null,
                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_assignments WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_assignments`);
    }
}

export default new AssignmentService();
