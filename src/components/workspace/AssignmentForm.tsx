import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
    Assignment,
    AssignmentPriority,
    AssignmentStatus,
    AssignmentType,
} from "../../types/workspace";
import { useCourses } from "../../hooks/workspace/useCourses";

interface AssignmentFormProps {
    initial?: Partial<Assignment>;
    onSubmit: (data: Omit<Assignment, "id">) => Promise<void> | void;
    onCancel?: () => void;
    submitLabel?: string;
}

type FormState = {
    title: string;
    courseId: string;
    courseName: string;
    description: string;
    assignmentStatus: AssignmentStatus;
    type: AssignmentType;
    priority: AssignmentPriority;
    deadline: string; // datetime-local
    repoUrl: string;
    submittedAt: string; // datetime-local (optional)
    feedback: string;
    attachmentsText: string; // "a,b,c"
};

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(v?: Date | string): string {
    if (!v) return "";
    const d = typeof v === "string" ? new Date(v) : v;
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isValidHttpUrl(value: string) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function parseList(text: string): string[] | undefined {
    const arr = text
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    return arr.length ? arr : undefined;
}

export default function AssignmentForm({
                                           initial,
                                           onSubmit,
                                           onCancel,
                                           submitLabel = "Save Assignment",
                                       }: AssignmentFormProps) {
    const { courses, loading: coursesLoading } = useCourses();

    const initialState = useMemo<FormState>(() => {
        return {
            title: initial?.title ?? "",
            courseId: initial?.courseId ?? "",
            courseName: initial?.courseName ?? "",
            description: initial?.description ?? "",
            assignmentStatus: (initial?.assignmentStatus ?? "pending") as AssignmentStatus,
            type: (initial?.type ?? "assignment") as AssignmentType,
            priority: (initial?.priority ?? "medium") as AssignmentPriority,
            deadline: toDatetimeLocalValue(initial?.deadline as any),
            repoUrl: initial?.repoUrl ?? "",
            submittedAt: toDatetimeLocalValue(initial?.submittedAt as any),
            feedback: initial?.feedback ?? "",
            attachmentsText: Array.isArray(initial?.attachments)
                ? initial!.attachments!.join(", ")
                : "",
        };
    }, [initial]);

    const [form, setForm] = useState<FormState>(initialState);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setForm(initialState);
        setErrors({});
    }, [initialState]);

    // Auto-sync courseName ketika courses sudah keload (penting buat mode edit)
    useEffect(() => {
        if (!form.courseId) return;
        const c = courses.find((x) => x.id === form.courseId);
        if (!c) return;

        setForm((p) => {
            if (p.courseName === c.title) return p;
            return { ...p, courseName: c.title };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courses, form.courseId]);

    // Auto-fill submittedAt ketika status berubah ke submitted/graded (kalau belum ada)
    useEffect(() => {
        if (
            (form.assignmentStatus === "submitted" || form.assignmentStatus === "graded") &&
            !form.submittedAt
        ) {
            setForm((p) => ({ ...p, submittedAt: toDatetimeLocalValue(new Date()) }));
        }
        if (form.assignmentStatus === "pending" && form.submittedAt) {
            setForm((p) => ({ ...p, submittedAt: "" }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.assignmentStatus]);

    function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function validate(curr: FormState) {
        const e: Record<string, string> = {};
        if (!curr.title.trim()) e.title = "Title wajib diisi.";
        if (!curr.courseId.trim()) e.courseId = "Course wajib dipilih.";
        if (!curr.deadline.trim() || Number.isNaN(new Date(curr.deadline).getTime())) {
            e.deadline = "Deadline wajib & harus valid.";
        }

        if (curr.repoUrl.trim() && !isValidHttpUrl(curr.repoUrl.trim())) {
            e.repoUrl = "Repo URL tidak valid (harus http/https).";
        }
        if (curr.submittedAt.trim() && Number.isNaN(new Date(curr.submittedAt).getTime())) {
            e.submittedAt = "Submitted time tidak valid.";
        }
        return e;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        const curr = {
            ...form,
            title: form.title.trim(),
            courseId: form.courseId.trim(),
            courseName: form.courseName.trim(),
            description: form.description.trim(),
            repoUrl: form.repoUrl.trim(),
            feedback: form.feedback.trim(),
        };

        const v = validate(curr);
        setErrors(v);
        if (Object.keys(v).length) return;

        setSaving(true);
        try {
            await onSubmit({
                title: curr.title,
                courseId: curr.courseId,
                courseName: curr.courseName,
                description: curr.description || undefined,
                assignmentStatus: curr.assignmentStatus,
                type: curr.type,
                priority: curr.priority,
                deadline: new Date(curr.deadline),
                repoUrl: curr.repoUrl || undefined,
                submittedAt: curr.submittedAt ? new Date(curr.submittedAt) : undefined,
                feedback: curr.feedback || undefined,
                attachments: parseList(curr.attachmentsText),
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Title</label>
                <input
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    placeholder="e.g. Week 3 Lab"
                />
                {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Course */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Course</label>

                <select
                    value={form.courseId}
                    onChange={(e) => {
                        const id = e.target.value;
                        const c = courses.find((x) => x.id === id);
                        handleChange("courseId", id);
                        handleChange("courseName", c?.title ?? "");
                    }}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    disabled={coursesLoading || courses.length === 0}
                >
                    <option value="" disabled>
                        {coursesLoading ? "Loading courses..." : courses.length ? "Select course" : "No courses yet"}
                    </option>

                    {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.title} ({c.code})
                        </option>
                    ))}
                </select>

                {errors.courseId && <p className="text-xs text-red-400">{errors.courseId}</p>}
            </div>

            {/* Status / Type / Priority */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Status</label>
                    <select
                        value={form.assignmentStatus}
                        onChange={(e) => handleChange("assignmentStatus", e.target.value as AssignmentStatus)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    >
                        <option value="pending">pending</option>
                        <option value="submitted">submitted</option>
                        <option value="graded">graded</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Type</label>
                    <select
                        value={form.type}
                        onChange={(e) => handleChange("type", e.target.value as AssignmentType)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    >
                        <option value="assignment">assignment</option>
                        <option value="practice">practice</option>
                        <option value="exam">exam</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Priority</label>
                    <select
                        value={form.priority}
                        onChange={(e) => handleChange("priority", e.target.value as AssignmentPriority)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                    </select>
                </div>
            </div>

            {/* Deadline / SubmittedAt */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Deadline</label>
                    <input
                        type="datetime-local"
                        value={form.deadline}
                        onChange={(e) => handleChange("deadline", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    />
                    {errors.deadline && <p className="text-xs text-red-400">{errors.deadline}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Submitted at (optional)</label>
                    <input
                        type="datetime-local"
                        value={form.submittedAt}
                        onChange={(e) => handleChange("submittedAt", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                        disabled={form.assignmentStatus === "pending"}
                    />
                    {errors.submittedAt && <p className="text-xs text-red-400">{errors.submittedAt}</p>}
                </div>
            </div>

            {/* Repo URL */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Repo URL (optional)</label>
                <input
                    value={form.repoUrl}
                    onChange={(e) => handleChange("repoUrl", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    placeholder="https://github.com/..."
                />
                {errors.repoUrl && <p className="text-xs text-red-400">{errors.repoUrl}</p>}
            </div>

            {/* Attachments */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Attachments (comma separated)</label>
                <input
                    value={form.attachmentsText}
                    onChange={(e) => handleChange("attachmentsText", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    placeholder="file1.pdf, link2, ..."
                />
            </div>

            {/* Description */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="w-full bg-secondary border border-line savings-scroll rounded-md px-3 py-2 text-sm text-slate-200 resize-none"
                    rows={3}
                    placeholder="Short note..."
                />
            </div>

            {/* Feedback */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Feedback (optional)</label>
                <textarea
                    value={form.feedback}
                    onChange={(e) => handleChange("feedback", e.target.value)}
                    className="w-full bg-secondary border border-line savings-scroll rounded-md px-3 py-2 text-sm text-slate-200 resize-none"
                    rows={2}
                    placeholder="Grader notes..."
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
                    {saving ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
}