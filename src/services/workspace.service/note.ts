// src/services/workspace.service/note.service.ts
import type { Note } from '../../types/workspace';

const STORAGE_KEY = 'persony_workspace_notes';

class NoteService {
    private readRaw(): Note[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Note[];
            return parsed.map((n) => ({
                ...n,
                createdAt: new Date(n.createdAt),
                updatedAt: new Date(n.updatedAt),
            }));
        } catch {
            return [];
        }
    }

    private writeRaw(items: Note[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Note[]> {
        return this.readRaw();
    }

    async getByCourse(courseId: string): Promise<Note[]> {
        return this.readRaw().filter((n) => n.courseId === courseId);
    }

    async add(
        data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Note> {
        const all = this.readRaw();
        const now = new Date();
        const note: Note = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        all.push(note);
        this.writeRaw(all);
        return note;
    }

    async update(id: string, patch: Partial<Note>): Promise<Note | null> {
        const all = this.readRaw();
        const index = all.findIndex((n) => n.id === id);
        if (index === -1) return null;

        const updated: Note = {
            ...all[index],
            ...patch,
            updatedAt: new Date(),
        };
        all[index] = updated;
        this.writeRaw(all);
        return updated;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        this.writeRaw(all.filter((n) => n.id !== id));
    }

    async clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }
}

const noteService = new NoteService();
export default noteService;
