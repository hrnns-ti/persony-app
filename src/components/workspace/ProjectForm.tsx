import React, { useState } from 'react';
import type { ProjectStatus, Project } from '../../types/workspace';
import SavedColorPicker from "../ui/ColorPicker.tsx";

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

    const [saving, setSaving] = useState(false);

    function handleChange<K extends keyof typeof form>(
        key: K,
        value: (typeof form)[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
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

            {/* Status */}
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
                {/* Slot kosong untuk field lain nanti */}
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

            {/* Color + Saved Colors */}
            <SavedColorPicker value={form.color} onChange={(c) => handleChange('color', c)} storageKey={'saved color'}/>

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