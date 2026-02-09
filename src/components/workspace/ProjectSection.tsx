import {useEffect, useMemo, useState} from "react";
import { useProjects } from "../../hooks/workspace/useProjects";
import ProjectDetail from "./ProjectDetail";
import Modal from "../ui/Modal";
import ProjectForm from "./ProjectForm";

function truncate(text: string, max = 50) {
    const s = (text ?? "").trim();
    if (!s) return "";
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
}

function ProgressBar({
    value,
    className = "",
    showLabel = true,
}: {
    value: number;
    className?: string;
    showLabel?: boolean;
}) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Progress</span>
                    <span className="tabular-nums">{v}%</span>
                </div>
            )}

            <div className="relative h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                <div className="h-full rounded-full bg-slate-400" style={{ width: `${v}%` }} />
            </div>
        </div>
    );
}

export default function ProjectsSection() {
    const { projects, loading, error, addProject, updateProject, removeProject } = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const selectedProject = useMemo(
        () => projects.find((p) => p.id === selectedProjectId) ?? null,
        [projects, selectedProjectId]
    );


    useEffect(() => {
        if (selectedProjectId && !selectedProject) setSelectedProjectId(null);
    }, [selectedProjectId, selectedProject]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="bg-main border border-line rounded-lg p-4 flex flex-col h-[100%]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="mx-1 text-sm font-semibold text-slate-400">Projects</h2>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="h-7 w-7 rounded-md flex items-center justify-center bg-main border border-line text-white text-sm hover:border-blue-400 hover:text-blue-400"
                    aria-label="Add Project"
                    title="Add Project"
                >
                    +
                </button>
            </div>

            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            {/* Horizontal slider list */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 savings-scroll scroll-smooth">
                {loading && <p className="text-xs text-slate-500">Loading projects...</p>}

                {!loading && projects.length === 0 && (
                    <p className="text-xs text-slate-500">No projects yet. Click + to add one.</p>
                )}

                {!loading && projects.length > 0 && (
                    <div className="flex gap-3 pr-1 pb-1 snap-x snap-mandatory">
                        {projects.map((p) => {
                            const deadline =
                                p.deadline instanceof Date
                                    ? p.deadline
                                    : p.deadline
                                        ? new Date(p.deadline as any)
                                        : null;

                            const shortDesc = truncate(p.description, 79);

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedProjectId(p.id)}
                                    className="snap-start flex-shrink-0 w-[270px] bg-main border rounded-lg px-4 py-3 text-xs flex flex-col gap-2 hover:bg-slate-850 transition-all cursor-pointer"
                                    style={{borderColor: p.color}}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-slate-100 text-sm font-semibold truncate">{p.title}</p>
                                                <span
                                                    className="h-2 w-8 rounded-full flex-shrink-0 mt-1"
                                                    style={{ backgroundColor: p.color }}
                                                />
                                            </div>


                                            <div className="mt-2 min-h-[32px]">
                                                {shortDesc ? (
                                                    <p className="text-slate-400 whitespace-normal break-words text-[11px] line-clamp-2">
                                                        {shortDesc}
                                                    </p>
                                                ) : (
                                                    <p className="text-slate-400 text-[11px] opacity-0 select-none">
                                                        placeholder
                                                    </p>
                                                )}
                                            </div>

                                            <ProgressBar value={p.progress ?? 0} className="mt-2" />

                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span className="px-2 py-0.5 rounded-full border border-slate-700">
                                          {p.projectStatus}
                                        </span>
                                        {deadline && !Number.isNaN(deadline.getTime()) && (
                                            <span>
                                                Due{" "}
                                                {deadline.toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Project">
                <ProjectForm
                    onSubmit={async (data) => {
                        await addProject(data);
                        setIsCreateOpen(false);
                    }}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </Modal>

            {/* Project Detail Modal */}
            {selectedProject && (
                <Modal
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProjectId(null)}
                    title={selectedProject.title}
                >
                    <ProjectDetail
                        project={selectedProject}
                        onClose={() => setSelectedProjectId(null)}
                        onUpdate={async (id, patch) => {
                            await updateProject(id, patch);
                        }}
                        onDelete={async (id) => {
                            await removeProject(id);
                            setSelectedProjectId(null);
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}