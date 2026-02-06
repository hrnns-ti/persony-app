import { useEffect, useMemo, useRef, useState } from "react";
import ProjectForm from "./ProjectForm";
import type { Project } from "../../types/workspace";

interface ProjectDetailProps {
    project: Project;
    onClose: () => void;
    onUpdate: (id: string, patch: Partial<Project>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

type TaskItem = {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
};

function uid() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export default function ProjectDetail({ project, onClose, onUpdate, onDelete }: ProjectDetailProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // --- Tasks persistence (localStorage) ---
    const tasksKey = useMemo(() => `project_tasks:${project.id}`, [project.id]);
    const syncKey = useMemo(() => `project_tasks_sync:${project.id}`, [project.id]);

    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [newTask, setNewTask] = useState("");
    const [hideDone, setHideDone] = useState(false);
    const [syncProgressFromTasks, setSyncProgressFromTasks] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem(syncKey);
            return raw ? raw === "1" : true; // default ON
        } catch {
            return true;
        }
    });

    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(tasksKey);
            const parsed = raw ? JSON.parse(raw) : [];
            setTasks(Array.isArray(parsed) ? parsed : []);
        } catch {
            setTasks([]);
        }
    }, [tasksKey]);

    const persistTasks = (next: TaskItem[]) => {
        try {
            localStorage.setItem(tasksKey, JSON.stringify(next));
        } catch {}
    };

    useEffect(() => {
        try {
            localStorage.setItem(syncKey, syncProgressFromTasks ? "1" : "0");
        } catch {}
    }, [syncKey, syncProgressFromTasks]);

    const deadline =
        project.deadline instanceof Date
            ? project.deadline
            : project.deadline
                ? new Date(project.deadline as any)
                : null;

    const stats = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter((t) => t.done).length;
        const progressFromTasks = total > 0 ? Math.round((done / total) * 100) : null;
        return { total, done, progressFromTasks };
    }, [tasks]);

    const displayedProgress = clamp(
        stats.progressFromTasks ?? (typeof project.progress === "number" ? project.progress : 0),
        0,
        100
    );

    const visibleTasks = useMemo(() => (hideDone ? tasks.filter((t) => !t.done) : tasks), [tasks, hideDone]);

    const desc = (project.description ?? "").trim();

    // --- sync progress to backend (debounced) ---
    useEffect(() => {
        if (!syncProgressFromTasks) return;
        if (stats.progressFromTasks == null) return;

        const next = stats.progressFromTasks;
        const current = typeof project.progress === "number" ? project.progress : 0;
        if (next === current) return;

        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            onUpdate(project.id, { progress: next });
        }, 350);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats.progressFromTasks, syncProgressFromTasks, project.id]);

    // --- task actions ---
    function addTask() {
        const text = newTask.trim();
        if (!text) return;
        setTasks((prev) => {
            const next = [{ id: uid(), text, done: false, createdAt: Date.now() }, ...prev];
            persistTasks(next);
            return next;
        });
        setNewTask("");
    }

    function toggleTask(id: string) {
        setTasks((prev) => {
            const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
            persistTasks(next);
            return next;
        });
    }

    function deleteTask(id: string) {
        setTasks((prev) => {
            const next = prev.filter((t) => t.id !== id);
            persistTasks(next);
            return next;
        });
    }

    function clearDone() {
        setTasks((prev) => {
            const next = prev.filter((t) => !t.done);
            persistTasks(next);
            return next;
        });
    }

    // --- project actions ---
    async function handleUpdate(data: Omit<Project, "id">) {
        await onUpdate(project.id, data);
        setIsEditing(false);
    }

    async function handleDelete() {
        await onDelete(project.id);
        onClose();
    }

    return (
        <div className="space-y-3">
            {!isEditing ? (
                <>
                    {/* Compact header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                                <h3 className="text-base font-semibold text-white truncate">{project.title}</h3>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                <span className="px-2 py-0.5 rounded-full border border-slate-700">
                                  {project.projectStatus}
                                </span>

                                {deadline && !Number.isNaN(deadline.getTime()) && (
                                    <span className="px-2 py-0.5 rounded-full border border-slate-700">
                                        Due {deadline.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </span>
                                )}

                                <span className="px-2 py-0.5 rounded-full border border-slate-700">
                                    Tasks {stats.done}/{stats.total}
                                </span>

                                {project.repoUrl && (
                                    <a
                                        href={project.repoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-0.5 rounded-full border border-slate-700 hover:border-blue-500 hover:text-blue-400"
                                    >
                                        Repo
                                    </a>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 w-9 grid place-items-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                            aria-label="Close"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Description (compact) */}
                    {/* Description (max 3 lines, stable height) */}
                    {/* Description (max 3 lines, stable height) */}
                    <div className="min-h-[54px]">
                        {desc ? (
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                                {desc}
                            </p>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic">No description.</p>
                        )}
                    </div>

                    {/* Progress (compact) */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 mt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-300">Progress</p>
                            <p className="text-xs text-slate-300 tabular-nums">{displayedProgress}%</p>
                        </div>

                        <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${displayedProgress}%` }} />
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={syncProgressFromTasks}
                                    onChange={(e) => setSyncProgressFromTasks(e.target.checked)}
                                />
                                Sync progress from tasks
                            </label>

                            {stats.progressFromTasks != null && (
                                <span className="text-[11px] text-slate-500">Tasks → {stats.progressFromTasks}%</span>
                            )}
                        </div>
                    </div>

                    {/* Tasks panel */}
                    <div className="rounded-lg border savings-scroll border-slate-800 bg-slate-900 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-300">Tasks</p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setHideDone((v) => !v)}
                                    className="px-2 py-1 text-[11px] rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    {hideDone ? "Show done" : "Hide done"}
                                </button>

                                <button
                                    type="button"
                                    onClick={clearDone}
                                    disabled={stats.done === 0}
                                    className="px-2 py-1 text-[11px] rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 sav">
                            <input
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addTask();
                                    }
                                }}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                                placeholder="Add task…"
                            />
                            <button
                                type="button"
                                onClick={addTask}
                                disabled={!newTask.trim()}
                                className="px-3 py-2 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>

                        <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
                            {visibleTasks.length === 0 ? (
                                <p className="text-[11px] text-slate-500">
                                    {tasks.length === 0 ? "No tasks yet." : "No tasks to show."}
                                </p>
                            ) : (
                                visibleTasks.map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={t.done}
                                            onChange={() => toggleTask(t.id)}
                                        />

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${t.done ? "text-slate-500 line-through" : "text-slate-100"}`}>
                                                {t.text}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => deleteTask(t.id)}
                                            className="h-7 w-7 grid place-items-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                                            aria-label="Delete task"
                                            title="Delete"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 px-3 py-2 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                            Edit Project
                        </button>

                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex-1 px-3 py-2 text-xs rounded-md border border-red-700/60 text-red-300 hover:bg-red-900/20"
                        >
                            Delete
                        </button>
                    </div>

                    {/* Delete confirm */}
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
                </>
            ) : (
                <ProjectForm initial={project} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} />
            )}
        </div>
    );
}
