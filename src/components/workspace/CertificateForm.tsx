import React, { useEffect, useMemo, useState } from "react";
import type { Certificate } from "../../types/workspace";

interface CertificateFormProps {
    initial?: Partial<Certificate>;
    onSubmit: (data: Omit<Certificate, "id">) => Promise<void> | void;
    onCancel?: () => void;
    onDelete?: () => Promise<void> | void;

    onUploadPdf?: () => Promise<void> | void;
    pendingPdfName?: string | null;
    busy?: boolean;
}

type FormState = {
    name: string;
    issuedBy: string;
    issueDate: string; // YYYY-MM-DD
    expiryDate: string; // YYYY-MM-DD
    noExpiry: boolean;
    credentialUrl: string;
    description: string;
};

function toDateInputValue(d?: Date | string) {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "";
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function dateFromInput(value: string): Date | undefined {
    if (!value) return undefined;
    return new Date(`${value}T00:00:00`);
}

function isValidHttpUrl(value: string) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

export default function CertificateForm({
    initial,
    onSubmit,
    onCancel,
    onDelete,
    onUploadPdf,
    pendingPdfName,
    busy = false,
}: CertificateFormProps) {
    const isEdit = useMemo(() => Boolean((initial as any)?.id), [initial]);

    const [form, setForm] = useState<FormState>({
        name: initial?.name ?? "",
        issuedBy: initial?.issuedBy ?? "",
        issueDate: toDateInputValue(initial?.issueDate as any) || toDateInputValue(new Date()),
        expiryDate: toDateInputValue(initial?.expiryDate as any),
        noExpiry: !initial?.expiryDate,
        credentialUrl: initial?.credentialUrl ?? "",
        description: initial?.description ?? "",
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const locked = busy || saving || deleting;

    useEffect(() => {
        setForm({
            name: initial?.name ?? "",
            issuedBy: initial?.issuedBy ?? "",
            issueDate: toDateInputValue(initial?.issueDate as any) || toDateInputValue(new Date()),
            expiryDate: toDateInputValue(initial?.expiryDate as any),
            noExpiry: !initial?.expiryDate,
            credentialUrl: initial?.credentialUrl ?? "",
            description: initial?.description ?? "",
        });
        setErrors({});
    }, [initial]);

    function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function validate(curr: FormState) {
        const e: Record<string, string> = {};
        if (!curr.name.trim()) e.name = "Name is required.";
        if (!curr.issuedBy.trim()) e.issuedBy = "Issued By is required.";
        if (!curr.issueDate) e.issueDate = "Issue date is required.";

        if (curr.credentialUrl.trim() && !isValidHttpUrl(curr.credentialUrl.trim())) {
            e.credentialUrl = "Invalid URL (must be http/https).";
        }

        if (!curr.noExpiry && curr.expiryDate) {
            const a = dateFromInput(curr.issueDate)?.getTime() ?? 0;
            const b = dateFromInput(curr.expiryDate)?.getTime() ?? 0;
            if (b && a && b < a) e.expiryDate = "Expiry cannot be before issue date.";
        }
        return e;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (locked) return;

        const v = validate(form);
        setErrors(v);
        if (Object.keys(v).length) return;

        setSaving(true);
        try {
            await onSubmit({
                name: form.name.trim(),
                issuedBy: form.issuedBy.trim(),
                issueDate: dateFromInput(form.issueDate) ?? new Date(),
                expiryDate: form.noExpiry ? undefined : dateFromInput(form.expiryDate),
                credentialUrl: form.credentialUrl.trim() ? form.credentialUrl.trim() : undefined,
                description: form.description.trim(),
                // filePath & previewDataUrl diisi via attachPdf, bukan form
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!onDelete || locked) return;
        setDeleting(true);
        try {
            await onDelete();
        } finally {
            setDeleting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                    {isEdit ? "Edit Certificate" : "Add Certificate"}
                </h2>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-slate-400 border h-7 w-7 rounded-md border-slate-600 hover:bg-slate-800 transition-colors text-sm"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Name</label>
                <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm"
                    placeholder="e.g. AWS Certified Developer"
                    disabled={locked}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Issued By</label>
                    <input
                        value={form.issuedBy}
                        onChange={(e) => handleChange("issuedBy", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. Coursera / Google"
                        disabled={locked}
                    />
                    {errors.issuedBy && <p className="text-xs text-red-400">{errors.issuedBy}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Issue Date</label>
                    <input
                        type="date"
                        value={form.issueDate}
                        onChange={(e) => handleChange("issueDate", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm"
                        disabled={locked}
                    />
                    {errors.issueDate && <p className="text-xs text-red-400">{errors.issueDate}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">Expiry</label>
                    <label className="flex items-center gap-2 text-xs text-slate-400 select-none">
                        <input
                            type="checkbox"
                            checked={form.noExpiry}
                            onChange={(e) => handleChange("noExpiry", e.target.checked)}
                            disabled={locked}
                        />
                        No expiry
                    </label>
                </div>

                <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => handleChange("expiryDate", e.target.value)}
                    disabled={locked || form.noExpiry}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm disabled:opacity-60"
                />
                {errors.expiryDate && <p className="text-xs text-red-400">{errors.expiryDate}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Credential URL (optional)</label>
                <input
                    value={form.credentialUrl}
                    onChange={(e) => handleChange("credentialUrl", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm"
                    placeholder="https://..."
                    disabled={locked}
                />
                {errors.credentialUrl && <p className="text-xs text-red-400">{errors.credentialUrl}</p>}
            </div>

            {/* Upload PDF */}
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onUploadPdf}
                    disabled={!onUploadPdf || locked}
                    className="px-3 py-2 text-xs rounded-md border border-line text-slate-200 hover:border-slate-400 disabled:opacity-50"
                >
                    Upload PDF
                </button>

                {pendingPdfName ? (
                    <span className="text-[11px] text-slate-400 truncate max-w-[60%]">
            Selected: {pendingPdfName}
          </span>
                ) : (
                    <span className="text-[11px] text-slate-600">
            {isEdit ? "You can attach/replace PDF." : "Attach after create."}
          </span>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="w-full bg-secondary border border-line  rounded-md px-3 py-2 text-sm resize-none"
                    rows={3}
                    placeholder="Notes about this certificate..."
                    disabled={locked}
                />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
                {onDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={locked}
                        className="px-3 py-1.5 text-xs rounded-md border text-slate-400 border-slate-600 hover:border-red hover:text-red disabled:opacity-60"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                )}

                <button
                    type="submit"
                    disabled={locked || !form.name.trim() || !form.issuedBy.trim()}
                    className="px-4 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>
        </form>
    );
}
