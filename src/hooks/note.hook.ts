import { useEffect, useState } from 'react';
import { Note } from '../types';
import noteService from '../services/note.service';

export function useNotes(courseId?: string) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            const data = courseId
                ? await noteService.getByCourse(courseId)
                : await noteService.getAll();

            if (!mounted) return;
            setNotes(data);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [courseId]);

    async function addNote(
        input: Omit<Note, 'id' | 'createdDate' | 'lastModified'>
    ) {
        const created = await noteService.add(input);
        setNotes(prev => [...prev, created]);
    }

    async function updateNote(id: string, patch: Partial<Note>) {
        const updated = await noteService.update(id, patch);
        if (!updated) return;
        setNotes(prev => prev.map(n => (n.id === id ? updated : n)));
    }

    async function removeNote(id: string) {
        await noteService.remove(id);
        setNotes(prev => prev.filter(n => n.id !== id));
    }

    return {
        notes,
        loading,
        addNote,
        updateNote,
        removeNote,
    };
}
