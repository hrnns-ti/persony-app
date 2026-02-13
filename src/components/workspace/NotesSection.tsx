import { useMemo, useState } from "react"
import { useNotes } from "../../hooks/workspace/useNotes"
import NotesCanvas from "./NotesCanvas"

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
    const [query, setQuery] = useState("")
    const [creating, setCreating] = useState(false)
    const [openNoteId, setOpenNoteId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return notes
        return notes.filter((n) => {
            const inTitle = (n.title || "").toLowerCase().includes(q)
            const inTags = (n.tags || []).some((t) => t.toLowerCase().includes(q))
            return inTitle || inTags
        })
    }, [notes, query])

    async function handleCreate() {
        if (creating) return
        setCreating(true)
        try {
            const created = await addNote({
                title: "Untitled canvas",
                tags: [],
                content: "",
                isPinned: false,
            } as any)

            setOpenNoteId(created.id)
        } finally {
            setCreating(false)
        }
    }

    return (
        <>
            {openNoteId ? (
                <NotesCanvas noteId={openNoteId} onBack={() => setOpenNoteId(null)} />
            ) : null}

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
                                <button className="min-w-0 flex-1 text-left" onClick={() => setOpenNoteId(n.id)}>
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
                                        className="px-2 py-1 rounded-md border border-line text-[11px] text-white hover:bg-white/5"
                                        onClick={() => updateNote(n.id, { isPinned: !n.isPinned })}
                                        title={n.isPinned ? "Unpin" : "Pin"}
                                    >
                                        {n.isPinned ? "Unpin" : "Pin"}
                                    </button>

                                    <button
                                        className="px-2 py-1 rounded-md border border-red-500/40 text-[11px] text-red-300 hover:bg-red-500/10"
                                        onClick={async () => {
                                            const ok = confirm(`Delete "${n.title || "Untitled"}"?`)
                                            if (!ok) return
                                            await removeNote(n.id)
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
