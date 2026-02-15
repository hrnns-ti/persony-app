import { useMemo, useState } from "react"
import { useNotes } from "../../hooks/workspace/useNotes"
import { useCourses } from "../../hooks/workspace/useCourses"
import { useProjects } from "../../hooks/workspace/useProjects"
import NotesCanvas from "./NotesCanvas"
import NoteDetailModal from "./NotesDetail"

function formatDate(d: Date) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(d))
    } catch {
        return new Date(d).toLocaleString()
    }
}

export default function NotesSection() {
    const { notes, loading, error, addNote, updateNote, removeNote } = useNotes()
    const { courses } = useCourses()
    const { projects } = useProjects()

    const [query, setQuery] = useState("")
    const [creating, setCreating] = useState(false)

    const [detailNoteId, setDetailNoteId] = useState<string | null>(null)
    const [openCanvasNoteId, setOpenCanvasNoteId] = useState<string | null>(null)
    const [returnToDetailId, setReturnToDetailId] = useState<string | null>(null)

    const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)
    const [deleting, setDeleting] = useState(false)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return notes
        return notes.filter((n) => {
            const inTitle = (n.title || "").toLowerCase().includes(q)
            const inTags = (n.tags || []).some((t) => t.toLowerCase().includes(q))
            return inTitle || inTags
        })
    }, [notes, query])

    const activeDetailNote = useMemo(() => {
        if (!detailNoteId) return null
        return notes.find((n) => n.id === detailNoteId) ?? null
    }, [detailNoteId, notes])

    async function handleCreate() {
        if (creating) return
        setCreating(true)
        try {
            const created = await addNote({
                title: "Untitled",
                tags: [],
                content: "",
                isPinned: false,
            } as any)

            setDetailNoteId(created.id)
        } finally {
            setCreating(false)
        }
    }

    return (
        <>
            {confirmDelete ? (
                <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/60">
                    <div className="w-[420px] rounded-xl border border-line bg-main p-4 shadow-xl">
                        <div className="text-sm font-semibold text-white">Delete note</div>
                        <div className="mt-2 text-sm text-white/70">
                            Delete <span className="font-semibold text-white">"{confirmDelete.title}"</span>?
                            <div className="mt-1 text-xs text-white/50">This action cannot be undone.</div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-1.5 rounded-md border border-line text-xs text-white hover:bg-white/5 disabled:opacity-60"
                                disabled={deleting}
                                onClick={() => setConfirmDelete(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="px-3 py-1.5 rounded-md bg-red-600 text-xs text-white hover:bg-red-500 disabled:opacity-60"
                                disabled={deleting}
                                onClick={async () => {
                                    setDeleting(true)
                                    try {
                                        await removeNote(confirmDelete.id)
                                        setConfirmDelete(null)
                                    } finally {
                                        setDeleting(false)
                                    }
                                }}
                            >
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Canvas overlay */}
            {openCanvasNoteId ? (
                <NotesCanvas
                    noteId={openCanvasNoteId}
                    onBack={() => {
                        setOpenCanvasNoteId(null)
                        if (returnToDetailId) {
                            setDetailNoteId(returnToDetailId)
                            setReturnToDetailId(null)
                        }
                    }}
                    onUpdateNote={updateNote as any}
                />
            ) : null}

            {/* Detail modal */}
            <NoteDetailModal
                isOpen={!!detailNoteId}
                note={activeDetailNote as any}
                courses={courses as any}
                projects={projects as any}
                onClose={() => setDetailNoteId(null)}
                onSave={async (id, patch) => {
                    await updateNote(id, patch as any)
                }}
                onDelete={async (id) => {
                    await removeNote(id)
                }}
                onOpenCanvas={(id) => {
                    setReturnToDetailId(id)
                    setDetailNoteId(null)
                    setOpenCanvasNoteId(id)
                }}
            />

            {/* Notes list */}
            <div className="bg-main border border-line rounded-lg p-4 flex flex-col h-full">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                        <div className="text-sm font-semibold text-white">Notes</div>
                        <div className="text-xs text-white/50">{notes.length} total</div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="px-3 py-1.5 rounded-md border border-line text-xs text-white hover:bg-white/5 disabled:opacity-50"
                    >
                        + New
                    </button>
                </div>

                <div className="mt-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notes…"
                        className="w-full rounded-md bg-black/20 border border-line px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
                    />
                </div>

                {error ? <div className="mt-3 text-xs text-red-400">{error}</div> : null}

                <div className="mt-3 flex-1 overflow-auto pr-1 space-y-2">
                    {loading ? (
                        <div className="text-xs text-white/50">Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-xs text-white/50">No notes found.</div>
                    ) : (
                        filtered.map((n) => (
                            <div
                                key={n.id}
                                className="group rounded-lg border border-line bg-black/10 hover:bg-black/20 transition px-3 py-2 flex items-center justify-between gap-3"
                            >
                                <button
                                    type="button"
                                    className="min-w-0 flex-1 text-left"
                                    onClick={() => setDetailNoteId(n.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {n.isPinned ? <span className="text-xs">📌</span> : null}
                                        <div className="truncate text-sm text-white">{n.title || "Untitled"}</div>
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-white/50">
                                        Updated {formatDate(n.updatedAt)}
                                        {n.tags?.length ? ` • ${n.tags.join(", ")}` : ""}
                                    </div>
                                </button>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        type="button"
                                        className="px-2 py-1 rounded-md border border-line text-[11px] text-white hover:bg-white/5"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            updateNote(n.id, { isPinned: !n.isPinned } as any)
                                        }}
                                        title={n.isPinned ? "Unpin" : "Pin"}
                                    >
                                        {n.isPinned ? "Unpin" : "Pin"}
                                    </button>

                                    <button
                                        type="button"
                                        className="px-2 py-1 rounded-md border border-red-500/40 text-[11px] text-red-300 hover:bg-red-500/10"
                                        onPointerDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setConfirmDelete({ id: n.id, title: n.title || "Untitled" })
                                        }}
                                        title="Delete"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}