import { useEffect, useState } from 'react';
import type { Project } from '../../types/workspace';
import projectService from '../../services/workspace.service/project';

export function useProjects(courseId?: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = courseId
                    ? await projectService.getByCourse(courseId)
                    : await projectService.getAll();
                if (!mounted) return;
                setProjects(data);
            } catch (err) {
                console.error('Failed to load projects', err);
                if (!mounted) return;
                setError('Failed to load projects');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [courseId]);

    async function addProject(
        input: Omit<Project, 'id'>
    ): Promise<Project> {
        try {
            const created = await projectService.add(input);
            setProjects((prev) => [...prev, created]);
            return created;
        } catch (err) {
            console.error('Failed to add project', err);
            setError('Failed to add project');
            throw err;
        }
    }

    async function updateProject(
        id: string,
        patch: Partial<Project>
    ): Promise<Project | null> {
        try {
            const updated = await projectService.update(id, patch);
            if (!updated) return null;
            setProjects((prev) =>
                prev.map((p) => (p.id === id ? updated : p)),
            );
            return updated;
        } catch (err) {
            console.error('Failed to update project', err);
            setError('Failed to update project');
            throw err;
        }
    }

    async function removeProject(id: string): Promise<void> {
        try {
            await projectService.remove(id);
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error('Failed to delete project', err);
            setError('Failed to delete project');
            throw err;
        }
    }

    return {
        projects,
        loading,
        error,
        addProject,
        updateProject,
        removeProject,
    };
}
