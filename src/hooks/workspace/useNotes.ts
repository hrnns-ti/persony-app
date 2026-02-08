import { useCallback, useEffect, useRef, useState } from 'react';
import type { Note } from '../../types/workspace';
import noteService from '../../services/workspace.service/note';

function sortNotes(items: Note[]) {
    return [...items].sort((a, b) => {
        const ap = a.isPinned ? 1 : 0;
        const bp = b.isPinned ? 1 : 0;
        if (ap !== bp) return bp - ap;

        const au = new Date(a.updatedAt).getTime();
        const bu = new Date(b.updatedAt).getTime();
        return bu - au;
    });
}

export function useNotes(courseId?: string) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const loadNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = courseId
                ? await noteService.getByCourse(courseId)
                : await noteService.getAll();
            if (!mountedRef.current) return;
            setNotes(sortNotes(data));
        } catch (err) {
            console.error('Failed to load notes', err);
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load notes');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [courseId]);

    useEffect(() => { void loadNotes(); }, [loadNotes]);

    const addNote = useCallback(async (input: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            const created = await noteService.add(input);
            setNotes(prev => sortNotes([created, ...prev]));
            return created;
        } catch (err) {
            console.error('Failed to add note', err);
            setError(err instanceof Error ? err.message : 'Failed to add note');
            throw err;
        }
    }, []);

    const updateNote = useCallback(async (id: string, patch: Partial<Note>) => {
        try {
            setError(null);
            const updated = await noteService.update(id, patch);
            if (!updated) return null;
            setNotes(prev => sortNotes(prev.map(n => (n.id === id ? updated : n))));
            return updated;
        } catch (err) {
            console.error('Failed to update note', err);
            setError(err instanceof Error ? err.message : 'Failed to update note');
            throw err;
        }
    }, []);

    const removeNote = useCallback(async (id: string) => {
        try {
            setError(null);
            await noteService.remove(id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete note', err);
            setError(err instanceof Error ? err.message : 'Failed to delete note');
            throw err;
        }
    }, []);

    return {
        notes,
        loading,
        error,
        addNote,
        updateNote,
        removeNote,
        refresh: loadNotes,
    };
}
