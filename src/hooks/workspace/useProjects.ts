import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../../types/workspace';
import projectService from '../../services/workspace.service/project';

function sortProjects(items: Project[]) {
    return [...items].sort((a, b) => {
        const aHas = !!a.deadline;
        const bHas = !!b.deadline;
        if (aHas !== bHas) return aHas ? -1 : 1;

        const ad = a.deadline ? new Date(a.deadline).getTime() : 0;
        const bd = b.deadline ? new Date(b.deadline).getTime() : 0;
        if (ad !== bd) return ad - bd;

        return (a.title || '').localeCompare(b.title || '');
    });
}

export function useProjects(courseId?: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const loadProjects = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = courseId
                ? await projectService.getByCourse(courseId)
                : await projectService.getAll();
            if (!mountedRef.current) return;
            setProjects(sortProjects(data));
        } catch (err) {
            console.error('Failed to load projects', err);
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [courseId]);

    useEffect(() => { void loadProjects(); }, [loadProjects]);

    const addProject = useCallback(async (input: Omit<Project, 'id'>) => {
        try {
            setError(null);
            const created = await projectService.add(input);
            setProjects(prev => sortProjects([created, ...prev]));
            return created;
        } catch (err) {
            console.error('Failed to add project', err);
            setError(err instanceof Error ? err.message : 'Failed to add project');
            throw err;
        }
    }, []);

    const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
        try {
            setError(null);
            const updated = await projectService.update(id, patch);
            if (!updated) return null;
            setProjects(prev => sortProjects(prev.map(p => (p.id === id ? updated : p))));
            return updated;
        } catch (err) {
            console.error('Failed to update project', err);
            setError(err instanceof Error ? err.message : 'Failed to update project');
            throw err;
        }
    }, []);

    const removeProject = useCallback(async (id: string) => {
        try {
            setError(null);
            await projectService.remove(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete project', err);
            setError(err instanceof Error ? err.message : 'Failed to delete project');
            throw err;
        }
    }, []);

    return {
        projects,
        loading,
        error,
        addProject,
        updateProject,
        removeProject,
        refresh: loadProjects,
    };
}
