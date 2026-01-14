// src/components/workspace/CourseForm.tsx
import { useState } from 'react';
import type { Course } from '../../types/workspace';

interface CourseFormProps {
    initial?: Partial<Course>;
    onSubmit: (data: Omit<Course, 'id'>) => Promise<void> | void;
    onCancel?: () => void;
}

export default function CourseForm({ initial, onSubmit, onCancel }: CourseFormProps) {
    const [form, setForm] = useState({
        title: initial?.title ?? '',
        code: initial?.code ?? '',
        semester: initial?.semester ?? '',
        description: initial?.description ?? '',
        status: (initial?.status ?? 'active') as Course['status'],
        startDate: initial?.startDate ? new Date(initial.startDate) : undefined,
        endDate: initial?.endDate ? new Date(initial.endDate) : undefined,
        color: initial?.color ?? '#6366f1',
    });
    const [saving, setSaving] = useState(false);

    function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return;

        setSaving(true);
        try {
            await onSubmit({
                title: form.title.trim(),
                code: form.code.trim() || undefined,
                semester: form.semester.trim() || undefined,
                description: form.description.trim(),
                status: form.status,
                startDate: form.startDate,
                endDate: form.endDate,
                color: form.color,
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Course Name</label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. UI/UX Design"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Code</label>
                    <input
                        type="text"
                        value={form.code}
                        onChange={(e) => handleChange('code', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. UI101"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Status</label>
                    <select
                        value={form.status}
                        onChange={(e) => handleChange('status', e.target.value as Course['status'])}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Semester</label>
                    <input
                        type="text"
                        value={form.semester}
                        onChange={(e) => handleChange('semester', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. Fall 2024"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Color</label>
                    <input
                        type="color"
                        value={form.color}
                        onChange={(e) => handleChange('color', e.target.value)}
                        className="w-full h-10 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Course description..."
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Start Date</label>
                    <input
                        type="date"
                        value={
                            form.startDate ? form.startDate.toISOString().slice(0, 10) : ''
                        }
                        onChange={(e) =>
                            handleChange(
                                'startDate',
                                e.target.value ? new Date(e.target.value) : undefined
                            )
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">End Date</label>
                    <input
                        type="date"
                        value={form.endDate ? form.endDate.toISOString().slice(0, 10) : ''}
                        onChange={(e) =>
                            handleChange(
                                'endDate',
                                e.target.value ? new Date(e.target.value) : undefined
                            )
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    />
                </div>
            </div>

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
                    {saving ? 'Saving...' : 'Save Course'}
                </button>
            </div>
        </form>
    );
}
