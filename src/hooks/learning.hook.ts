import { useEffect, useState } from 'react';
import { Assignment, Course } from '../types';
import learningService from '../services/learning.service';

// ----- Courses -----
export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            const data = await learningService.getCourses();
            if (!mounted) return;
            setCourses(data);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    async function addCourse(input: Omit<Course, 'id'>) {
        const created = await learningService.addCourse(input);
        setCourses(prev => [...prev, created]);
    }

    async function updateCourse(id: string, patch: Partial<Course>) {
        const updated = await learningService.updateCourse(id, patch);
        if (!updated) return;
        setCourses(prev => prev.map(c => (c.id === id ? updated : c)));
    }

    async function removeCourse(id: string) {
        await learningService.removeCourse(id);
        setCourses(prev => prev.filter(c => c.id !== id));
    }

    return {
        courses,
        loading,
        addCourse,
        updateCourse,
        removeCourse,
    };
}

// ----- Assignments -----
export function useAssignments(courseId?: string) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            let data: Assignment[];
            if (courseId) {
                data = await learningService.getAssignmentsByCourse(courseId);
            } else {
                data = await learningService.getAssignments();
            }
            if (!mounted) return;
            setAssignments(data);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [courseId]);

    async function addAssignment(input: Omit<Assignment, 'id'>) {
        const created = await learningService.addAssignment(input);
        setAssignments(prev => [...prev, created]);
    }

    async function updateAssignment(id: string, patch: Partial<Assignment>) {
        const updated = await learningService.updateAssignment(id, patch);
        if (!updated) return;
        setAssignments(prev => prev.map(a => (a.id === id ? updated : a)));
    }

    async function removeAssignment(id: string) {
        await learningService.removeAssignment(id);
        setAssignments(prev => prev.filter(a => a.id !== id));
    }

    async function submitAssignment(id: string) {
        const updated = await learningService.submitAssignment(id);
        if (!updated) return;
        setAssignments(prev => prev.map(a => (a.id === id ? updated : a)));
    }

    return {
        assignments,
        loading,
        addAssignment,
        updateAssignment,
        removeAssignment,
        submitAssignment,
    };
}
