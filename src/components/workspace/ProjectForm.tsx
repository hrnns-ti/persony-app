import React, { useEffect, useMemo, useState } from "react";
import type { ProjectStatus, Project } from "../../types/workspace";
import SavedColorPicker from "../ui/ColorPicker";

interface ProjectFormProps {
    initial?: Partial<Project>;
    onSubmit: (data: Omit<Project, "id">) => Promise<void> | void;
    onCancel?: () => void;
}

type FormState = {
    title: string;
    description: string;
    projectStatus: ProjectStatus;
    deadline: string; // YYYY-MM-DD (untuk <input type="date">)
    color: string;
    courseId?: string;
    repoUrl: string;
    progress: number;
    tagsText: string; // "tag1, tag2"
};

function toDateInputValue(d?: Date | string): string {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "";
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseTags(text: string): string[] {
    return text
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
}

function isValidHttpUrl(value: string) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

/** ✅ Opsi B: custom stepper (tanpa spinner) */
function TinyNumberStepper({
                               value,
                               onChange,
                               min = 0,
                               max = 100,
                               step = 1,
                               disabled = false,
                               className = "w-24",
                           }: {
    value: number;
    onChange: (next: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
}) {
    const [text, setText] = useState(String(value));

    // sync kalau value berubah dari luar (mis. status done => 100)
    useEffect(() => {
        setText(String(value));
    }, [value]);

    const inc = () => onChange(clamp(value + step, min, max));
    const dec = () => onChange(clamp(value - step, min, max));

    return (
        <div className={`relative ${className}`}>
            <input
                value={text}
                disabled={disabled}
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label="Progress value"
                onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    setText(digits);

                    if (digits === "") return; // biar user bisa hapus dulu saat mengetik
                    onChange(clamp(Number(digits), min, max));
                }}
                onBlur={() => {
                    // saat keluar field, pastikan valid dan tidak kosong
                    const next = text === "" ? min : clamp(Number(text), min, max);
                    setText(String(next));
                    onChange(next);
                }}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "ArrowUp") {
                        e.preventDefault();
                        inc();
                    }
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        dec();
                    }
                }}
                className={[
                    "w-full rounded-md border bg-slate-900 px-3 py-2 pr-10 text-sm tabular-nums",
                    "border-slate-700 text-slate-100 placeholder:text-slate-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60",
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-text",
                ].join(" ")}
            />

            <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                <button
                    type="button"
                    disabled={disabled || value >= max}
                    onClick={inc}
                    className={[
                        "flex-1 w-8 rounded-md grid place-items-center",
                        "text-slate-300 hover:bg-slate-800 active:bg-slate-700",
                        "disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed",
                    ].join(" ")}
                    aria-label="Increase"
                >
                    <span className="text-[10px] leading-none">▲</span>
                </button>

                <button
                    type="button"
                    disabled={disabled || value <= min}
                    onClick={dec}
                    className={[
                        "flex-1 w-8 rounded-md grid place-items-center",
                        "text-slate-300 hover:bg-slate-800 active:bg-slate-700",
                        "disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed",
                    ].join(" ")}
                    aria-label="Decrease"
                >
                    <span className="text-[10px] leading-none">▼</span>
                </button>
            </div>
        </div>
    );
}

export default function ProjectForm({ initial, onSubmit, onCancel }: ProjectFormProps) {
    const initialState = useMemo<FormState>(() => {
        const tags = Array.isArray((initial as any)?.tags) ? (initial as any).tags : [];
        return {
            title: initial?.title ?? "",
            description: initial?.description ?? "",
            projectStatus: (initial?.projectStatus ?? "planning") as ProjectStatus,
            deadline: toDateInputValue(initial?.deadline as any),
            color: initial?.color ?? "#6366f1",
            courseId: initial?.courseId ?? undefined,
            repoUrl: initial?.repoUrl ?? "",
            progress: typeof initial?.progress === "number" ? initial.progress : 0,
            tagsText: tags.length ? tags.join(", ") : "",
        };
    }, [initial]);

    const [form, setForm] = useState<FormState>(initialState);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setForm(initialState);
        setErrors({});
    }, [initialState]);

    useEffect(() => {
        if (form.projectStatus === "done" && form.progress !== 100) {
            setForm((p) => ({ ...p, progress: 100 }));
        }
    }, [form.projectStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    const isDirty = useMemo(() => {
        return (
            form.title !== initialState.title ||
            form.description !== initialState.description ||
            form.projectStatus !== initialState.projectStatus ||
            form.deadline !== initialState.deadline ||
            form.color !== initialState.color ||
            form.courseId !== initialState.courseId ||
            form.repoUrl !== initialState.repoUrl ||
            form.progress !== initialState.progress ||
            form.tagsText !== initialState.tagsText
        );
    }, [form, initialState]);

    function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function validate(curr: FormState) {
        const e: Record<string, string> = {};

        if (!curr.title.trim()) e.title = "Project name wajib diisi.";

        if (curr.repoUrl.trim() && !isValidHttpUrl(curr.repoUrl.trim())) {
            e.repoUrl = "Repository URL tidak valid (harus http/https).";
        }

        if (!Number.isFinite(curr.progress)) e.progress = "Progress harus angka.";
        if (curr.progress < 0 || curr.progress > 100) e.progress = "Progress harus 0–100.";

        return e;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const curr = {
            ...form,
            title: form.title.trim(),
            description: form.description.trim(),
            repoUrl: form.repoUrl.trim(),
            progress: clamp(Number(form.progress) || 0, 0, 100),
        };

        const v = validate(curr);
        setErrors(v);
        if (Object.keys(v).length) return;

        setSaving(true);
        try {
            const deadlineDate = curr.deadline ? new Date(`${curr.deadline}T00:00:00`) : undefined;

            await onSubmit({
                title: curr.title,
                description: curr.description,
                projectStatus: curr.projectStatus,
                repoUrl: curr.repoUrl ? curr.repoUrl : undefined,
                courseId: curr.courseId || undefined,
                deadline: deadlineDate,
                color: curr.color,
                progress: curr.progress,
                tags: parseTags(curr.tagsText),
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
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. API Integration"
                />
                {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Status + Progress */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Status</label>
                    <select
                        value={form.projectStatus}
                        onChange={(e) => handleChange("projectStatus", e.target.value as ProjectStatus)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="planning">Planning</option>
                        <option value="designing">Designing</option>
                        <option value="coding">Coding</option>
                        <option value="done">Done</option>
                        <option value="canceled">Canceled</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Progress</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={form.progress}
                            onChange={(e) => handleChange("progress", Number(e.target.value))}
                            className="tiny-slider"
                            style={{ ["--value" as any]: form.progress }}
                        />

                        {/* ✅ ganti input number jadi stepper custom */}
                        <TinyNumberStepper
                            value={form.progress}
                            onChange={(v) => handleChange("progress", v)}
                            min={0}
                            max={100}
                            step={1}
                            className="w-24"
                            disabled={saving}
                        />
                    </div>
                    {errors.progress && <p className="text-xs text-red-400">{errors.progress}</p>}
                </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Deadline</label>
                <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => handleChange("deadline", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                />
            </div>

            {/* Repo URL */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Repository URL</label>
                <input
                    type="url"
                    value={form.repoUrl}
                    onChange={(e) => handleChange("repoUrl", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    placeholder="https://github.com/..."
                />
                {errors.repoUrl && <p className="text-xs text-red-400">{errors.repoUrl}</p>}
            </div>

            {/* Color */}
            <SavedColorPicker
                value={form.color}
                onChange={(c) => handleChange("color", c)}
                storageKey="savedColor"
            />

            {/* Tags */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Tags</label>
                <input
                    type="text"
                    value={form.tagsText}
                    onChange={(e) => handleChange("tagsText", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g. frontend, auth, refactor"
                />
                <p className="text-[11px] text-slate-500">Pisahkan dengan koma.</p>
            </div>

            {/* Description */}
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
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
                    disabled={saving || !form.title.trim() || (!isDirty && Boolean(initial?.id))}
                    className="px-4 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save Project"}
                </button>
            </div>
        </form>
    );
}
