import { useMemo, useState } from "react";
import type { Assignment } from "../../types/workspace";
import AssignmentForm from "./AssignmentForm";

interface Props {
    assignment: Assignment;
    onClose: () => void;
    onUpdate: (id: string, patch: Partial<Assignment>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

// Status badge warna khusus (bukan warna priority)
const STATUS_BADGE_CLASS: Record<Assignment["assignmentStatus"], string> = {
    pending: "border-slate-700 text-slate-300",
    submitted: "border-emerald-500/40 text-emerald-300",
    graded: "border-violet-500/40 text-violet-300",
};

function toDateSafe(v: any): Date | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

export default function AssignmentDetail({ assignment, onClose, onUpdate, onDelete }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const deadline = useMemo(() => toDateSafe(assignment.deadline), [assignment.deadline]);
    const submittedAt = useMemo(() => toDateSafe(assignment.submittedAt), [assignment.submittedAt]);

    const isOverdue =
        assignment.assignmentStatus === "pending" && deadline && deadline.getTime() < Date.now();

    async function markPending() {
        await onUpdate(assignment.id, { assignmentStatus: "pending", submittedAt: undefined });
    }

    async function markSubmitted() {
        await onUpdate(assignment.id, { assignmentStatus: "submitted", submittedAt: new Date() });
    }

    async function markGraded() {
        await onUpdate(assignment.id, {
            assignmentStatus: "graded",
            submittedAt: submittedAt ?? new Date(),
        });
    }

    return (
        <div className="space-y-3">
            {!isEditing ? (
                <>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-white truncate">{assignment.title}</h3>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                {/* Status badge (warna khusus) */}
                                <span
                                    className={`px-2 py-0.5 rounded-full border ${STATUS_BADGE_CLASS[assignment.assignmentStatus]}`}
                                >
                  {assignment.assignmentStatus}
                </span>

                                <span className="px-2 py-0.5 rounded-full border border-slate-700">
                  {assignment.type}
                </span>

                                <span className="px-2 py-0.5 rounded-full border border-slate-700">
                  {assignment.priority}
                </span>

                                {deadline && (
                                    <span
                                        className={`px-2 py-0.5 rounded-full border border-slate-700 ${
                                            isOverdue ? "text-red-400 border-red-500/40" : ""
                                        }`}
                                    >
                    Due{" "}
                                        {deadline.toLocaleString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                  </span>
                                )}

                                <span className="px-2 py-0.5 rounded-full border border-slate-700">
                  {assignment.courseName} • {assignment.courseId}
                </span>

                                {assignment.repoUrl && (
                                    <a
                                        href={assignment.repoUrl}
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

                    {/* Description */}
                    <div className="min-h-[44px]">
                        {(assignment.description ?? "").trim() ? (
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {assignment.description}
                            </p>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic">No description.</p>
                        )}
                    </div>

                    {/* Submitted / Feedback */}
                    <div className="rounded-lg border border-line bg-main p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-300">Submission</p>
                            <p className="text-[11px] text-slate-400">
                                {submittedAt
                                    ? submittedAt.toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "-"}
                            </p>
                        </div>

                        {(assignment.feedback ?? "").trim() ? (
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{assignment.feedback}</p>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic">No feedback.</p>
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="rounded-lg border border-line bg-main p-3">
                        <p className="text-xs font-semibold text-slate-300 mb-2">Attachments</p>
                        {assignment.attachments?.length ? (
                            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300">
                                {assignment.attachments.map((x, i) => (
                                    <li key={`${x}-${i}`} className="break-all">
                                        {x}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic">No attachments.</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={markPending}
                                className="px-3 py-1.5 text-xs rounded-md border border-line text-slate-300 hover:bg-slate-800"
                            >
                                Mark pending
                            </button>
                            <button
                                type="button"
                                onClick={markSubmitted}
                                className="px-3 py-1.5 text-xs rounded-md border border-line text-slate-300 hover:bg-slate-800"
                            >
                                Mark submitted
                            </button>
                            <button
                                type="button"
                                onClick={markGraded}
                                className="px-3 py-1.5 text-xs rounded-md border border-line text-slate-300 hover:bg-slate-800"
                            >
                                Mark graded
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500"
                            >
                                Edit
                            </button>

                            {!confirmDelete ? (
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(true)}
                                    className="px-3 py-1.5 text-xs rounded-md border border-red-500/50 text-red-300 hover:bg-red-500/10"
                                >
                                    Delete
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await onDelete(assignment.id);
                                        onClose();
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-500"
                                >
                                    Confirm delete
                                </button>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <AssignmentForm
                    initial={assignment}
                    submitLabel="Save Changes"
                    onCancel={() => setIsEditing(false)}
                    onSubmit={async (data) => {
                        await onUpdate(assignment.id, data);
                        setIsEditing(false);
                    }}
                />
            )}
        </div>
    );
}