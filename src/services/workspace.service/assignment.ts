import type { Assignment } from '../../types/workspace';

const STORAGE_KEY = 'persony_workspace_assignments';

class AssignmentService {
    private readRaw(): Assignment[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Assignment[];
            return parsed.map((a) => ({
                ...a,
                deadline: new Date(a.deadline),
                submittedAt: a.submittedAt ? new Date(a.submittedAt) : undefined,
            }));
        } catch {
            return [];
        }
    }

    private writeRaw(items: Assignment[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Assignment[]> {
        return this.readRaw();
    }

    async getByCourse(courseId: string): Promise<Assignment[]> {
        return this.readRaw().filter((a) => a.courseId === courseId);
    }

    async add(
        data: Omit<Assignment, 'id' | 'submittedAt'>
    ): Promise<Assignment> {
        const all = this.readRaw();
        const assignment: Assignment = {
            ...data,
            id: crypto.randomUUID(),
            submittedAt: undefined,
        };
        all.push(assignment);
        this.writeRaw(all);
        return assignment;
    }

    async update(
        id: string,
        patch: Partial<Assignment>
    ): Promise<Assignment | null> {
        const all = this.readRaw();
        const index = all.findIndex((a) => a.id === id);
        if (index === -1) return null;

        const updated: Assignment = {
            ...all[index],
            ...patch,
        };
        all[index] = updated;
        this.writeRaw(all);
        return updated;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        this.writeRaw(all.filter((a) => a.id !== id));
    }

    async clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }
}

const assignmentService = new AssignmentService();
export default assignmentService;
