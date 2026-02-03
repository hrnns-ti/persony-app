import { useState } from 'react';
import { useProjects } from '../../hooks/workspace/useProjects';
import ProjectForm from './ProjectForm';
import type { Project } from '../../types/workspace';

interface ProjectDetailProps {
    project: Project;
    onClose: () => void;
}

export default function ProjectDetail({ project, onClose }: ProjectDetailProps) {
    const { updateProject, removeProject } = useProjects();
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    async function handleUpdate(data: Omit<Project, 'id'>) {
        await updateProject(project.id, data);
        setIsEditing(false);
    }

    async function handleDelete() {
        await removeProject(project.id);
        onClose();
    }

    return (
        <div className="space-y-4">
            {!isEditing ? (
                <>
                    {/* Detail view */}
                    <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold text-white">{project.title}</h3>
                        <span
                            className="h-3 w-10 rounded-full"
                            style={{ backgroundColor: project.color }}
                        />
                    </div>

                    {project.description && (
                        <p className="text-slate-300 text-sm">{project.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="px-2 py-1 rounded-full border border-slate-700">
              {project.projectStatus}
            </span>
                        {project.deadline && (
                            <span>
                Due{' '}
                                {project.deadline.toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                })}
              </span>
                        )}
                    </div>

                    {project.repoUrl && (
                        <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:underline block"
                        >
                            {project.repoUrl}
                        </a>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 px-4 py-2 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex-1 px-4 py-2 text-xs rounded-md bg-red-600 text-white hover:bg-red-500"
                        >
                            Delete
                        </button>
                    </div>
                </>
            ) : (
                <ProjectForm
                    initial={project}
                    onSubmit={handleUpdate}
                    onCancel={() => setIsEditing(false)}
                />
            )}

            {/* Delete confirmation */}
            {confirmDelete && (
                <div className="space-y-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-slate-300">
                        Are you sure you want to delete <strong>{project.title}</strong>?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 px-4 py-2 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 px-4 py-2 text-xs rounded-md bg-red-600 text-white hover:bg-red-500"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}   