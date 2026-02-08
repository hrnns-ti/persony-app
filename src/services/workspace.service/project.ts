import type { Project } from "../../types/workspace";
import { getWorkspaceDb } from "./database";

type ProjectRow = {
    id: string;
    title: string;
    description: string;
    course_id: string | null;
    repo_url: string | null;
    deadline: string | null;
    project_status: "planning" | "designing" | "coding" | "done" | "canceled";
    progress: number | null;
    color: string;
    tags: string | null; // JSON
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

function rowToProject(r: ProjectRow): Project {
    return {
        id: r.id,
        title: r.title,
        description: r.description,
        courseId: r.course_id ?? undefined,
        repoUrl: r.repo_url ?? undefined,
        deadline: r.deadline ? new Date(r.deadline) : undefined,
        projectStatus: r.project_status,
        progress: r.progress ?? undefined,
        color: r.color,
        tags: safeJsonArray(r.tags),
    };
}

class ProjectService {
    async getAll(): Promise<Project[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<ProjectRow[]>(
            `SELECT * FROM workspace_projects
       ORDER BY (deadline IS NULL) ASC, deadline ASC, title ASC`
        );
        return rows.map(rowToProject);
    }

    async getByCourse(courseId: string): Promise<Project[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<ProjectRow[]>(
            `SELECT * FROM workspace_projects
       WHERE course_id = ?
       ORDER BY (deadline IS NULL) ASC, deadline ASC, title ASC`,
            [courseId]
        );
        return rows.map(rowToProject);
    }

    async add(data: Omit<Project, "id">): Promise<Project> {
        const db = await getWorkspaceDb();
        const id = crypto.randomUUID();

        await db.execute(
            `INSERT INTO workspace_projects
       (id, title, description, course_id, repo_url, deadline, project_status, progress, color, tags)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.title,
                data.description,
                data.courseId ?? null,
                data.repoUrl ?? null,
                toIsoOrNull(data.deadline),
                data.projectStatus,
                data.progress ?? null,
                data.color,
                data.tags ? JSON.stringify(data.tags) : null,
            ]
        );

        return { ...data, id };
    }

    async update(id: string, patch: Partial<Project>): Promise<Project | null> {
        const db = await getWorkspaceDb();
        const rows = await db.select<ProjectRow[]>(
            `SELECT * FROM workspace_projects WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToProject(rows[0]);

        const updated: Project = {
            ...current,
            ...patch,
            deadline: has(patch, "deadline") ? toDate((patch as any).deadline) : current.deadline,
            courseId: has(patch, "courseId") ? (patch.courseId ?? undefined) : current.courseId,
            repoUrl: has(patch, "repoUrl") ? (patch.repoUrl ?? undefined) : current.repoUrl,
            progress: has(patch, "progress") ? (patch.progress ?? undefined) : current.progress,
            tags: has(patch, "tags") ? (patch.tags ?? undefined) : current.tags,
        };

        await db.execute(
            `UPDATE workspace_projects
       SET title=?, description=?, course_id=?, repo_url=?, deadline=?,
           project_status=?, progress=?, color=?, tags=?
       WHERE id=?`,
            [
                updated.title,
                updated.description,
                updated.courseId ?? null,
                updated.repoUrl ?? null,
                toIsoOrNull(updated.deadline),
                updated.projectStatus,
                updated.progress ?? null,
                updated.color,
                updated.tags ? JSON.stringify(updated.tags) : null,
                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_projects WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_projects`);
    }
}

export default new ProjectService();
