// src/hooks/useCourses.ts
import { useEffect, useState } from 'react';
import type { Course } from '../../types/workspace';
import courseService from '../../services/workspace.service/course.ts';

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await courseService.getAll();
                if (!mounted) return;
                setCourses(data);
            } catch (err) {
                console.error('Failed to load courses', err);
                if (!mounted) return;
                setError('Failed to load courses');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    async function addCourse(input: Omit<Course, 'id'>): Promise<Course> {
        try {
            const created = await courseService.add(input);
            setCourses((prev) => [...prev, created]);
            return created;
        } catch (err) {
            console.error('Failed to add course', err);
            setError('Failed to add course');
            throw err;
        }
    }

    async function updateCourse(
        id: string,
        patch: Partial<Course>
    ): Promise<Course | null> {
        try {
            const updated = await courseService.update(id, patch);
            if (!updated) return null;
            setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
            return updated;
        } catch (err) {
            console.error('Failed to update course', err);
            setError('Failed to update course');
            throw err;
        }
    }

    async function removeCourse(id: string): Promise<void> {
        try {
            await courseService.remove(id);
            setCourses((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error('Failed to delete course', err);
            setError('Failed to delete course');
            throw err;
        }
    }

    return { courses, loading, error, addCourse, updateCourse, removeCourse };
}
