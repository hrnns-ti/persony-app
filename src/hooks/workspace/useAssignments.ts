import { useCallback, useEffect, useRef, useState } from 'react';
import type { Assignment } from '../../types/workspace.ts';
import assignmentService from '../../services/workspace.service/assignment.ts';

function sortAssignments(items: Assignment[]) {
    return [...items].sort((a, b) => {
        const ad = new Date(a.deadline).getTime();
        const bd = new Date(b.deadline).getTime();
        return ad - bd;
    });
}

export function useAssignments(courseId?: string) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const loadAssignments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = courseId
                ? await assignmentService.getByCourse(courseId)
                : await assignmentService.getAll();
            if (!mountedRef.current) return;
            setAssignments(sortAssignments(data));
        } catch (err) {
            console.error('Failed to load assignments', err);
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load assignments');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [courseId]);

    useEffect(() => { void loadAssignments(); }, [loadAssignments]);

    const addAssignment = useCallback(async (input: Omit<Assignment, 'id' | 'submittedAt'>) => {
        try {
            setError(null);
            const created = await assignmentService.add(input);
            setAssignments(prev => sortAssignments([created, ...prev]));
            return created;
        } catch (err) {
            console.error('Failed to add assignment', err);
            setError(err instanceof Error ? err.message : 'Failed to add assignment');
            throw err;
        }
    }, []);

    const updateAssignment = useCallback(async (id: string, patch: Partial<Assignment>) => {
        try {
            setError(null);
            const updated = await assignmentService.update(id, patch);
            if (!updated) return null;
            setAssignments(prev => sortAssignments(prev.map(a => (a.id === id ? updated : a))));
            return updated;
        } catch (err) {
            console.error('Failed to update assignment', err);
            setError(err instanceof Error ? err.message : 'Failed to update assignment');
            throw err;
        }
    }, []);

    const removeAssignment = useCallback(async (id: string) => {
        try {
            setError(null);
            await assignmentService.remove(id);
            setAssignments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Failed to delete assignment', err);
            setError(err instanceof Error ? err.message : 'Failed to delete assignment');
            throw err;
        }
    }, []);

    return {
        assignments,
        loading,
        error,
        addAssignment,
        updateAssignment,
        removeAssignment,
        refresh: loadAssignments,
    };
}
