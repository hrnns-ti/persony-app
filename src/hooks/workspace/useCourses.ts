import { useCallback, useEffect, useRef, useState } from 'react';
import type { Course } from '../../types/workspace';
import courseService from '../../services/workspace.service/course.ts';

function sortCourses(items: Course[]) {
    return [...items].sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : Number.NEGATIVE_INFINITY;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : Number.NEGATIVE_INFINITY;

        const aHas = !!a.startDate;
        const bHas = !!b.startDate;
        if (aHas !== bHas) return aHas ? -1 : 1;

        if (aDate !== bDate) return bDate - aDate;

        return (a.title || '').localeCompare(b.title || '');
    });
}

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const loadCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await courseService.getAll();
            if (!mountedRef.current) return;
            setCourses(sortCourses(data));
        } catch (err) {
            console.error('Failed to load courses', err);
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load courses');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => { void loadCourses(); }, [loadCourses]);

    const addCourse = useCallback(async (input: Omit<Course, 'id'>) => {
        try {
            setError(null);
            const created = await courseService.add(input);
            setCourses(prev => sortCourses([created, ...prev]));
            return created;
        } catch (err) {
            console.error('Failed to add course', err);
            setError(err instanceof Error ? err.message : 'Failed to add course');
            throw err;
        }
    }, []);

    const updateCourse = useCallback(async (id: string, patch: Partial<Course>) => {
        try {
            setError(null);
            const updated = await courseService.update(id, patch);
            if (!updated) return null;
            setCourses(prev => sortCourses(prev.map(c => (c.id === id ? updated : c))));
            return updated;
        } catch (err) {
            console.error('Failed to update course', err);
            setError(err instanceof Error ? err.message : 'Failed to update course');
            throw err;
        }
    }, []);

    const removeCourse = useCallback(async (id: string) => {
        try {
            setError(null);
            await courseService.remove(id);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Failed to delete course', err);
            setError(err instanceof Error ? err.message : 'Failed to delete course');
            throw err;
        }
    }, []);

    return {
        courses,
        loading,
        error,
        addCourse,
        updateCourse,
        removeCourse,
        refresh: loadCourses,
    };
}
