import { useEffect, useMemo, useState } from "react";
import type { Assignment, AssignmentStatus } from "../../types/workspace";
import { useAssignments } from "../../hooks/workspace/useAssignments";
import Modal from "../ui/Modal";
import AssignmentForm from "./AssignmentForm";
import AssignmentDetail from "./AssignmentDetail";

const PRIORITY_COLOR: Record<Assignment["priority"], string> = {
    low: "#64748b",
    medium: "#f59e0b",
    high: "#ef4444",
};

const PRIORITY_ORDER: Record<Assignment["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2,
};

const STATUS_ORDER: Record<AssignmentStatus, number> = {
    pending: 0,
    submitted: 1,
    graded: 2,
};

// Warna khusus status (badge/dot). BUKAN warna priority.
const STATUS_DOT_COLOR: Record<AssignmentStatus, string> = {
    pending: "#94a3b8", // slate
    submitted: "#10b981", // emerald
    graded: "#8b5cf6", // violet
};

const STATUS_BADGE_CLASS: Record<AssignmentStatus, string> = {
    pending: "border-slate-700 text-slate-300",
    submitted: "border-emerald-500/40 text-emerald-300",
    graded: "border-violet-500/40 text-violet-300",
};

function toDateSafe(v: any): Date | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

function dueLabel(a: Assignment) {
    const d = toDateSafe(a.deadline);
    if (!d) return "-";

    const now = new Date();
    const end = d.getTime();
    const diffDays = Math.ceil((end - now.getTime()) / (1000 * 60 * 60 * 24));

    const base = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    if (a.assignmentStatus !== "pending") return `Due ${base}`;
    if (diffDays < 0) return `Overdue • ${base}`;
    if (diffDays === 0) return `Today • ${base}`;
    if (diffDays === 1) return `Tomorrow • ${base}`;
    return `${diffDays}d • ${base}`;
}

export default function AssignmentsSection() {
    const { assignments, loading, error, addAssignment, updateAssignment, removeAssignment } =
        useAssignments();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [status, setStatus] = useState<AssignmentStatus | "all">("all");

    const selected = useMemo(
        () => assignments.find((x) => x.id === selectedId) ?? null,
        [assignments, selectedId]
    );

    useEffect(() => {
        if (selectedId && !selected) setSelectedId(null);
    }, [selectedId, selected]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        return assignments
            .filter((a) => {
                const okStatus = status === "all" ? true : a.assignmentStatus === status;
                if (!okStatus) return false;

                if (!query) return true;
                return (
                    a.title.toLowerCase().includes(query) ||
                    (a.courseName ?? "").toLowerCase().includes(query) ||
                    (a.courseId ?? "").toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                // 1) Status: pending -> submitted -> graded
                const s = STATUS_ORDER[a.assignmentStatus] - STATUS_ORDER[b.assignmentStatus];
                if (s !== 0) return s;

                // 2) Priority: high -> medium -> low (di dalam masing-masing status)
                const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                if (p !== 0) return p;

                // 3) Deadline: paling dekat dulu
                const ad = toDateSafe(a.deadline)?.getTime() ?? Number.POSITIVE_INFINITY;
                const bd = toDateSafe(b.deadline)?.getTime() ?? Number.POSITIVE_INFINITY;
                if (ad !== bd) return ad - bd;

                // 4) fallback title
                return a.title.localeCompare(b.title);
            })
    }, [assignments, q, status]);

    return (
        <div className="bg-main border border-line rounded-lg p-4 flex flex-col h-full hover:border-slate-700 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="mx-1 text-sm font-semibold text-slate-400">Assignments</h2>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="h-7 w-7 rounded-md flex items-center justify-center bg-main border border-line text-white text-sm hover:border-blue-400 hover:text-blue-400"
                    aria-label="Add Assignment"
                    title="Add Assignment"
                >
                    +
                </button>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-3">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-secondary border border-line rounded-md px-2 py-2 text-xs text-slate-200"
                >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                </select>

                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="flex-1 bg-secondary border border-line rounded-md px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    placeholder="Search assignment…"
                />
            </div>

            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            {/* List */}
            <div className="flex-1 overflow-y-auto savings-scroll pr-1">
                {loading && <p className="text-xs text-slate-500">Loading assignments...</p>}

                {!loading && filtered.length === 0 && (
                    <p className="text-xs text-slate-500">No assignments. Click + to add one.</p>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="space-y-2">
                        {filtered.map((a) => {
                            const bar = PRIORITY_COLOR[a.priority];
                            const deadline = toDateSafe(a.deadline);
                            const isOverdue =
                                a.assignmentStatus === "pending" && deadline && deadline.getTime() < Date.now();

                            return (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedId(a.id)}
                                    className="w-full text-left flex gap-3 border border-line rounded-lg p-3 hover:border-slate-700 transition-all"
                                >
                                    {/* Priority bar */}
                                    <span
                                        className="w-1 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: bar }}
                                        aria-hidden
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-100 truncate">{a.title}</p>

                                            {/* Due + status dot */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-[11px] tabular-nums ${isOverdue ? "text-red-400" : "text-slate-400"}`}>
                                                    {dueLabel(a)}
                                                </span>
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: STATUS_DOT_COLOR[a.assignmentStatus] }}
                                                    title={a.assignmentStatus}
                                                    aria-label={a.assignmentStatus}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                            {/* Status badge */}
                                            <span className={`px-2 py-0.5 rounded-full border ${STATUS_BADGE_CLASS[a.assignmentStatus]}`}>
                                                {a.assignmentStatus}
                                            </span>

                                            {/* Type badge (netral) */}
                                            <span className="px-2 py-0.5 rounded-full border border-slate-700">
                                                {a.type}
                                            </span>

                                            {/* Priority badge (tetap sesuai low/med/high) */}
                                            <span className="px-2 py-0.5 rounded-full border border-slate-700">
                                                {a.priority}
                                            </span>
                                            <span className="truncate max-w-[180px]">{a.courseName}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Assignment">
                <AssignmentForm
                    onSubmit={async (draft) => {
                        const { submittedAt, ...payload } = draft as any;
                        await addAssignment(payload);
                        setIsCreateOpen(false);
                    }}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </Modal>

            {/* Detail Modal */}
            {selected && (
                <Modal isOpen={!!selected} onClose={() => setSelectedId(null)} title={selected.title}>
                    <AssignmentDetail
                        assignment={selected}
                        onClose={() => setSelectedId(null)}
                        onUpdate={async (id, patch) => {
                            await updateAssignment(id, patch);
                        }}
                        onDelete={async (id) => {
                            await removeAssignment(id);
                            setSelectedId(null);
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}