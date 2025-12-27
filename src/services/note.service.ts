import { Note } from '../types';

const NOTE_KEY = 'persony_notes';

class NoteService {
    private readRaw(): Note[] {
        const raw = localStorage.getItem(NOTE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Note[];
            return parsed.map(n => ({
                ...n,
                createdDate: new Date(n.createdDate),
                lastModified: new Date(n.lastModified),
            }));
        } catch {
            return [];
        }
    }

    private writeRaw(items: Note[]): void {
        localStorage.setItem(NOTE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Note[]> {
        return this.readRaw();
    }

    async getByCourse(courseId: string): Promise<Note[]> {
        return this.readRaw().filter(n => n.courseId === courseId);
    }

    async add(data: Omit<Note, 'id' | 'createdDate' | 'lastModified'>): Promise<Note> {
        const all = this.readRaw();
        const now = new Date();
        const note: Note = {
            ...data,
            id: crypto.randomUUID(),
            createdDate: now,
            lastModified: now,
        };
        all.push(note);
        this.writeRaw(all);
        return note;
    }

    async update(id: string, patch: Partial<Note>): Promise<Note | null> {
        const all = this.readRaw();
        const index = all.findIndex(n => n.id === id);
        if (index === -1) return null;

        const updated: Note = {
            ...all[index],
            ...patch,
            lastModified: new Date(),
        };
        all[index] = updated;
        this.writeRaw(all);
        return updated;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        const filtered = all.filter(n => n.id !== id);
        this.writeRaw(filtered);
    }

    async clear(): Promise<void> {
        localStorage.removeItem(NOTE_KEY);
    }
}

const noteService = new NoteService();
export default noteService;
