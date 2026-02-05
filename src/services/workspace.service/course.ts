import type { Course } from "../../types/workspace";

const STORAGE_KEY = "persony_workspace_courses";

function toDate(v: unknown): Date | undefined {
    if (!v) return undefined;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;

    if (typeof v === "string" || typeof v === "number") {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }

    return undefined;
}

class CourseService {
    private readRaw(): Course[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw) as any[];

            return (Array.isArray(parsed) ? parsed : []).map((c) => ({
                ...c,
                startDate: toDate(c.startDate),
                endDate: toDate(c.endDate),
            })) as Course[];
        } catch {
            return [];
        }
    }

    private writeRaw(items: Course[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Course[]> {
        return this.readRaw();
    }

    async add(data: Omit<Course, "id">): Promise<Course> {
        const all = this.readRaw();
        const course: Course = {
            ...data,
            id: crypto.randomUUID(),
        };
        all.push(course);
        this.writeRaw(all);
        return course;
    }

    async update(id: string, patch: Partial<Course>): Promise<Course | null> {
        const all = this.readRaw();
        const index = all.findIndex((c) => c.id === id);
        if (index === -1) return null;

        const updated: Course = {
            ...all[index],
            ...patch,
            startDate: patch.startDate !== undefined ? toDate(patch.startDate) : all[index].startDate,
            endDate: patch.endDate !== undefined ? toDate(patch.endDate) : all[index].endDate,
        };

        all[index] = updated;
        this.writeRaw(all);
        return updated;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        this.writeRaw(all.filter((c) => c.id !== id));
    }

    async clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }
}

const courseService = new CourseService();
export default courseService;
