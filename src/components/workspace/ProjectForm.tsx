import { useState } from 'react';
import type { ProjectStatus, Project } from '../../types/workspace';
import {
    loadSavedProjectColors,
    addSavedProjectColor,
    removeSavedProjectColor,
} from '../../utils/projectColors';

interface ProjectFormProps {
    initial?: Partial<Project>;
    onSubmit: (data: Omit<Project, 'id'>) => Promise<void> | void;
    onCancel?: () => void;
}

export default function ProjectForm({
                                        initial,
                                        onSubmit,
                                        onCancel,
                                    }: ProjectFormProps) {
    const [form, setForm] = useState({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        projectStatus: (initial?.projectStatus ?? 'planning') as ProjectStatus,
        deadline: initial?.deadline ? new Date(initial.deadline) : undefined,
        color: initial?.color ?? '#6366f1',
        courseId: initial?.courseId ?? undefined,
        repoUrl: initial?.repoUrl ?? '',
        progress: initial?.progress ?? 0,
    });

    const [savedColors, setSavedColors] = useState<string[]>(() =>
        loadSavedProjectColors()
    );

    const [saving, setSaving] = useState(false);

    function handleChange<K extends keyof typeof form>(
        key: K,
        value: (typeof form)[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleColorChange(color: string) {
        handleChange('color', color);
    }

    function handleSaveCurrentColor() {
        const updated = addSavedProjectColor(form.color);
        setSavedColors(updated);
    }

    function handleRemoveSavedColor(color: string) {
        const updated = removeSavedProjectColor(color);
        setSavedColors(updated);
    }


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return;

        setSaving(true);
        try {
            await onSubmit({
                title: form.title.trim(),
                description: form.description.trim(),
                projectStatus: form.projectStatus,
                repoUrl: form.repoUrl || undefined,
                courseId: form.courseId || undefined,
                deadline: form.deadline,
                color: form.color,
                progress: form.progress,
                tags: [],
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Name */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Project Name</label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. API Integration"
                />
            </div>

            {/* Status (kolom kedua bisa dipakai nanti) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Status</label>
                    <select
                        value={form.projectStatus}
                        onChange={(e) =>
                            handleChange('projectStatus', e.target.value as ProjectStatus)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="planning">Planning</option>
                        <option value="designing">Designing</option>
                        <option value="coding">Coding</option>
                        <option value="done">Done</option>
                        <option value="canceled">Canceled</option>
                    </select>
                </div>

                {/* Slot kosong untuk future field (course, dsb.) */}
                {/* <div className="space-y-1">...</div> */}
            </div>

            {/* Deadline */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Deadline</label>
                <input
                    type="date"
                    value={
                        form.deadline ? form.deadline.toISOString().slice(0, 10) : ''
                    }
                    onChange={(e) =>
                        handleChange(
                            'deadline',
                            e.target.value ? new Date(e.target.value) : undefined
                        )
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                />
            </div>

            {/* Repo URL */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Repository URL</label>
                <input
                    type="text"
                    value={form.repoUrl}
                    onChange={(e) => handleChange('repoUrl', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    placeholder="https://github.com/..."
                />
            </div>

            {/* Color + Recent */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Color</label>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={form.color}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="h-9 w-14 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                    />
                    <button
                        type="button"
                        onClick={handleSaveCurrentColor}
                        className="px-2 py-1 text-[11px] rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                        Save color
                    </button>
                </div>

                {savedColors.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {savedColors.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => handleColorChange(c)}
                                className="relative h-6 w-6 rounded-full border border-slate-700"
                                style={{ backgroundColor: c }}
                            >
                              <span
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSavedColor(c);
                                  }}
                                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-slate-900 text-[9px] text-slate-300 flex items-center justify-center border border-slate-600 hover:bg-red-600 hover:text-white"
                              >
                                ×
                              </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>


            {/* Description */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Short description..."
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1.5 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className="px-4 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save Project'}
                </button>
            </div>
        </form>
    );
}