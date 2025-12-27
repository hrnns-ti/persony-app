import { Assignment, Course } from '../types';

const COURSE_KEY = 'persony_courses';
const ASSIGNMENT_KEY = 'persony_assignments';

class LearningService {
    // ===== COURSES =====
    private readCourses(): Course[] {
        const raw = localStorage.getItem(COURSE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Course[];
            return parsed.map(c => ({
                ...c,
                startDate: new Date(c.startDate),
                endDate: c.endDate ? new Date(c.endDate) : undefined,
            }));
        } catch {
            return [];
        }
    }

    private writeCourses(items: Course[]): void {
        localStorage.setItem(COURSE_KEY, JSON.stringify(items));
    }

    async getCourses(): Promise<Course[]> {
        return this.readCourses();
    }

    async addCourse(data: Omit<Course, 'id'>): Promise<Course> {
        const all = this.readCourses();
        const course: Course = {
            ...data,
            id: crypto.randomUUID(),
        };
        all.push(course);
        this.writeCourses(all);
        return course;
    }

    async updateCourse(id: string, patch: Partial<Course>): Promise<Course | null> {
        const all = this.readCourses();
        const index = all.findIndex(c => c.id === id);
        if (index === -1) return null;

        const updated: Course = { ...all[index], ...patch };
        all[index] = updated;
        this.writeCourses(all);
        return updated;
    }

    async removeCourse(id: string): Promise<void> {
        const all = this.readCourses();
        const filtered = all.filter(c => c.id !== id);
        this.writeCourses(filtered);

        // Optionally: also remove assignments of that course
        const assignments = this.readAssignments().filter(a => a.courseId !== id);
        this.writeAssignments(assignments);
    }


    // ===== ASSIGNMENTS =====
    private readAssignments(): Assignment[] {
        const raw = localStorage.getItem(ASSIGNMENT_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Assignment[];
            return parsed.map(a => ({
                ...a,
                deadline: new Date(a.deadline),
            }));
        } catch {
            return [];
        }
    }

    private writeAssignments(items: Assignment[]): void {
        localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(items));
    }

    async getAssignments(): Promise<Assignment[]> {
        return this.readAssignments();
    }

    async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
        return this.readAssignments().filter(a => a.courseId === courseId);
    }

    async addAssignment(data: Omit<Assignment, 'id'>): Promise<Assignment> {
        const all = this.readAssignments();
        const assignment: Assignment = {
            ...data,
            id: crypto.randomUUID(),
        };
        all.push(assignment);
        this.writeAssignments(all);
        return assignment;
    }

    async updateAssignment(
        id: string,
        patch: Partial<Assignment>,
    ): Promise<Assignment | null> {
        const all = this.readAssignments();
        const index = all.findIndex(a => a.id === id);
        if (index === -1) return null;

        const updated: Assignment = { ...all[index], ...patch };
        all[index] = updated;
        this.writeAssignments(all);
        return updated;
    }

    async removeAssignment(id: string): Promise<void> {
        const all = this.readAssignments();
        const filtered = all.filter(a => a.id !== id);
        this.writeAssignments(filtered);
    }

    async clearAll(): Promise<void> {
        localStorage.removeItem(COURSE_KEY);
        localStorage.removeItem(ASSIGNMENT_KEY);
    }

    // Mark course as completed
    async completeCourse(id: string): Promise<Course | null> {
        return this.updateCourse(id, { status: 'completed' });
    }

    // Mark assignment as submitted
    async submitAssignment(id: string): Promise<Assignment | null> {
        return this.updateAssignment(id, { status: 'submitted' });
    }
}

const learningService = new LearningService();
export default learningService;
