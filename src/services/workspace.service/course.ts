import type { Course } from '../../types/workspace';

const STORAGE_KEY = 'persony_workspace_courses';

class CourseService {
    private readRaw(): Course[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Course[];
            return parsed.map((c) => ({
                ...c,
                startDate: new Date(c.startDate),
                endDate: c.endDate ? new Date(c.endDate) : undefined,
            }));
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

    async add(data: Omit<Course, 'id'>): Promise<Course> {
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
