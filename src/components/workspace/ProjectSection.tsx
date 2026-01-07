import { useState } from 'react';
import { useProjects } from '../../hooks/workspace/useProjects';
import ProjectForm from './ProjectForm';
import Modal from '../ui/Modal';

export default function ProjectsSection() {
    const { projects, addProject, loading } = useProjects();
    const [isOpen, setIsOpen] = useState(false);

    async function handleCreate(data: any) {
        await addProject(data);
        setIsOpen(false);
    }

    return (
        <div className="bg-main border border-line rounded-xl p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 ">
            <h2 className=" mx-1 text-sm font-semibold text-slate-400">Projects</h2>
            <button
            onClick={() => setIsOpen(true)}
            className="h-7 w-7 rounded-md flex items-center justify-center bg-main border border-line text-white text-sm hover:border-blue-400 hover:text-blue-400">+</button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && (<p className="text-xs text-slate-500">Loading projects...</p>)}

        {!loading && projects.length === 0 && (
            <p className="text-xs text-slate-500">
                No projects yet. Click + to add one.
        </p>
        )}

        {!loading && projects.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-slate-100 text-sm font-semibold">{p.title}</p> {p.description && (<p className="text-slate-400 text-[11px] line-clamp-2">{p.description}</p>)}
                    </div>
                    <span className="h-2 w-8 rounded-full" style={{ backgroundColor: p.color }}/>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded-full border border-slate-700">{p.projectStatus}</span>
                    {p.deadline && (
                        <span>
                            Due{' '}
                        {p.deadline.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                        })}
                        </span>
                    )}
                </div>
            </div>
        ))}
    </div>

    <Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Add Project"
    >
    <ProjectForm
        onSubmit={handleCreate}
    onCancel={() => setIsOpen(false)}
    />
    </Modal>
    </div>
);
}
