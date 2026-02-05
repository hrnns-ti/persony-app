import React, { useMemo, useState } from 'react';
import type { Course, CourseStatus } from '../../types/workspace';
import SavedColorPicker from "../ui/ColorPicker.tsx";

interface CourseFormProps {
    initial?: Partial<Course>;
    onSubmit: (data: Omit<Course, 'id'>) => Promise<void> | void;
    onCancel?: () => void;
    onDelete?: () => Promise<void> | void;
}

type FormState = {
    title: string;
    code: string;
    semester: string;
    description: string;
    status: CourseStatus;
    startDate?: Date;
    endDate?: Date;
    color: string;
};

function toDateInputValue(d?: Date) {
    return d ? d.toISOString().slice(0, 10) : '';
}

export default function CourseForm({
        initial,
        onSubmit,
        onCancel,
        onDelete,
    }: CourseFormProps) {
    const [form, setForm] = useState<FormState>({
        title: initial?.title ?? '',
        code: initial?.code ?? '',
        semester: initial?.semester ?? '',
        description: initial?.description ?? '',
        status: (initial?.status ?? 'active') as CourseStatus,
        startDate: initial?.startDate ? new Date(initial.startDate) : undefined,
        endDate: initial?.endDate ? new Date(initial.endDate) : undefined,
        color: initial?.color ?? '#6366f1',
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isEdit = useMemo(() => Boolean((initial as Course | undefined)?.id), [initial]);
    const busy = saving || deleting;

    function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim() || busy) return;

        setSaving(true);
        try {
            const data: Omit<Course, 'id'> = {
                title: form.title.trim(),
                code: form.code.trim(),
                semester: form.semester.trim(),
                description: form.description.trim(),
                status: form.status,
                startDate: form.startDate,
                endDate: form.endDate,
                color: form.color,
            };
            await onSubmit(data);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!onDelete || busy) return;

        setDeleting(true);
        try {
            await onDelete();
        } finally {
            setDeleting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
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

            {/* Code & Status */}
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
                        onChange={(e) => handleChange('status', e.target.value as CourseStatus)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                    </select>
                </div>
            </div>

            {/* Semester & Color */}
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

                <SavedColorPicker value={form.color} onChange={(c) => handleChange('color', c)} storageKey={'saved color'}/>
            </div>

            {/* Description */}
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Start Date</label>
                    <input
                        type="date"
                        value={toDateInputValue(form.startDate)}
                        onChange={(e) =>
                            handleChange('startDate', e.target.value ? new Date(e.target.value) : undefined)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">End Date</label>
                    <input
                        type="date"
                        value={toDateInputValue(form.endDate)}
                        onChange={(e) =>
                            handleChange('endDate', e.target.value ? new Date(e.target.value) : undefined)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center justify-between"></div>
                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={busy}
                            className="px-3 py-1.5 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    )}

                    {isEdit && onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={busy}
                            className="px-3 py-1.5 text-xs rounded-md border border-red text-red hover:bg-red hover:text-main disabled:opacity-60"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={busy || !form.title.trim()}
                        className="px-4 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : 'Save Course'}
                    </button>
                </div>
            </div>
        </form>
    );
}
