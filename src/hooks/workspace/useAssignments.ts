// src/hooks/useAssignments.ts
import { useEffect, useState } from 'react';
import type { Assignment } from '../../types/workspace.ts';
import assignmentService from '../../services/workspace.service/assignment.ts';

export function useAssignments(courseId?: string) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = courseId
                    ? await assignmentService.getByCourse(courseId)
                    : await assignmentService.getAll();
                if (!mounted) return;
                setAssignments(data);
            } catch (err) {
                console.error('Failed to load assignments', err);
                if (!mounted) return;
                setError('Failed to load assignments');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [courseId]);

    async function addAssignment(
        input: Omit<Assignment, 'id' | 'submittedAt'>
    ): Promise<Assignment> {
        try {
            const created = await assignmentService.add(input);
            setAssignments((prev) => [...prev, created]);
            return created;
        } catch (err) {
            console.error('Failed to add assignment', err);
            setError('Failed to add assignment');
            throw err;
        }
    }

    async function updateAssignment(
        id: string,
        patch: Partial<Assignment>
    ): Promise<Assignment | null> {
        try {
            const updated = await assignmentService.update(id, patch);
            if (!updated) return null;
            setAssignments((prev) =>
                prev.map((a) => (a.id === id ? updated : a)),
            );
            return updated;
        } catch (err) {
            console.error('Failed to update assignment', err);
            setError('Failed to update assignment');
            throw err;
        }
    }

    async function removeAssignment(id: string): Promise<void> {
        try {
            await assignmentService.remove(id);
            setAssignments((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error('Failed to delete assignment', err);
            setError('Failed to delete assignment');
            throw err;
        }
    }

    return {
        assignments,
        loading,
        error,
        addAssignment,
        updateAssignment,
        removeAssignment,
    };
}
