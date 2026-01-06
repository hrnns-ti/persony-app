// src/services/workspace.service/project.service.ts
import type { Project } from '../../types/workspace';

const STORAGE_KEY = 'persony_workspace_projects';

class ProjectService {
    private readRaw(): Project[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Project[];
            return parsed.map((p) => ({
                ...p,
                deadline: p.deadline ? new Date(p.deadline) : undefined,
            }));
        } catch {
            return [];
        }
    }

    private writeRaw(items: Project[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Project[]> {
        return this.readRaw();
    }

    async getByCourse(courseId: string): Promise<Project[]> {
        return this.readRaw().filter((p) => p.courseId === courseId);
    }

    async add(data: Omit<Project, 'id'>): Promise<Project> {
        const all = this.readRaw();
        const project: Project = {
            ...data,
            id: crypto.randomUUID(),
        };
        all.push(project);
        this.writeRaw(all);
        return project;
    }

    async update(id: string, patch: Partial<Project>): Promise<Project | null> {
        const all = this.readRaw();
        const index = all.findIndex((p) => p.id === id);
        if (index === -1) return null;

        const updated: Project = {
            ...all[index],
            ...patch,
        };
        all[index] = updated;
        this.writeRaw(all);
        return updated;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        this.writeRaw(all.filter((p) => p.id !== id));
    }

    async clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }
}

const projectService = new ProjectService();
export default projectService;
