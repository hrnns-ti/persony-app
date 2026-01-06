// src/hooks/useNotes.ts
import { useEffect, useState } from 'react';
import type { Note } from '../../types/workspace';
import noteService from '../../services/workspace.service/note';

export function useNotes(courseId?: string) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = courseId
                    ? await noteService.getByCourse(courseId)
                    : await noteService.getAll();
                if (!mounted) return;
                setNotes(data);
            } catch (err) {
                console.error('Failed to load notes', err);
                if (!mounted) return;
                setError('Failed to load notes');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [courseId]);

    async function addNote(
        input: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Note> {
        try {
            const created = await noteService.add(input);
            setNotes((prev) => [...prev, created]);
            return created;
        } catch (err) {
            console.error('Failed to add note', err);
            setError('Failed to add note');
            throw err;
        }
    }

    async function updateNote(
        id: string,
        patch: Partial<Note>
    ): Promise<Note | null> {
        try {
            const updated = await noteService.update(id, patch);
            if (!updated) return null;
            setNotes((prev) =>
                prev.map((n) => (n.id === id ? updated : n)),
            );
            return updated;
        } catch (err) {
            console.error('Failed to update note', err);
            setError('Failed to update note');
            throw err;
        }
    }

    async function removeNote(id: string): Promise<void> {
        try {
            await noteService.remove(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            console.error('Failed to delete note', err);
            setError('Failed to delete note');
            throw err;
        }
    }

    return {
        notes,
        loading,
        error,
        addNote,
        updateNote,
        removeNote,
    };
}
