import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react"
import Modal from "../ui/Modal"
import type { Course, Note, Project } from "../../types/workspace"

type Props = {
    isOpen: boolean
    note: Note | null
    courses: Course[]
    projects: Project[]
    onClose: () => void
    onSave: (noteId: string, patch: Partial<Note>) => Promise<void>
    onDelete: (noteId: string) => Promise<void>
    onOpenCanvas: (noteId: string) => void
}

export default function NoteDetailModal({
                                            isOpen,
                                            note,
                                            courses,
                                            projects,
                                            onClose,
                                            onSave,
                                            onDelete,
                                            onOpenCanvas,
                                        }: Props) {
    const [title, setTitle] = useState("")
    const [tagsText, setTagsText] = useState("")
    const [isPinned, setIsPinned] = useState(false)

    const [courseId, setCourseId] = useState<string>("")
    const [projectId, setProjectId] = useState<string>("")

    const [saving, setSaving] = useState(false)

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!note) return
        setTitle(note.title ?? "")
        setTagsText((note.tags ?? []).join(", "))
        setIsPinned(!!note.isPinned)
        setCourseId(note.courseId ?? "")
        setProjectId(note.projectId ?? "")

        setConfirmDeleteOpen(false)
        setDeleting(false)
    }, [note])

    const tags = useMemo(
        () =>
            tagsText
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        [tagsText]
    )

    const normalizedProjects = useMemo(() => {
        return projects.map((p: any) => ({
            ...p,
            courseId: p.courseId ?? p.course_id ?? undefined,
        })) as (Project & { courseId?: string })[]
    }, [projects])

    const visibleProjects = useMemo(() => {
        if (!courseId) return normalizedProjects

        return normalizedProjects.filter((p) => {
            if (p.courseId === courseId) return true
            if (!p.courseId) return true
            if (projectId && p.id === projectId) return true
            return false
        })
    }, [normalizedProjects, courseId, projectId])

    function resolveNames(nextCourseId?: string, nextProjectId?: string) {
        const courseName = nextCourseId ? courses.find((c) => c.id === nextCourseId)?.title : undefined
        const projectName = nextProjectId
            ? normalizedProjects.find((p) => p.id === nextProjectId)?.title
            : undefined
        return { courseName, projectName }
    }

    async function persist() {
        if (!note) return
        const finalTitle = title.trim() || "Untitled"

        const nextCourseId = courseId || undefined
        const nextProjectId = projectId || undefined
        const { courseName, projectName } = resolveNames(nextCourseId, nextProjectId)

        setSaving(true)
        try {
            await onSave(note.id, {
                title: finalTitle,
                tags,
                isPinned,
                courseId: nextCourseId,
                courseName,
                projectId: nextProjectId,
                projectName,
            })
        } finally {
            setSaving(false)
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (deleting) return
        await persist()
        onClose()
    }

    async function handleOpenCanvas(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!note || deleting) return
        await persist()
        onOpenCanvas(note.id)
    }

    async function handleConfirmDelete() {
        if (!note) return
        setDeleting(true)
        try {
            await onDelete(note.id)
            setConfirmDeleteOpen(false)
            onClose()
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={() => !deleting && onClose()} title={note ? "Edit Note" : "Note"}>
            {!note ? (
                <div className="text-sm text-white/60">No note selected.</div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <div className="text-xs text-white/60">Title</div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md bg-black/20 border border-line px-3 py-2 text-sm text-white outline-none"
                            placeholder="Untitled"
                            disabled={saving || deleting}
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-white/60">Tags (comma separated)</div>
                        <input
                            value={tagsText}
                            onChange={(e) => setTagsText(e.target.value)}
                            className="w-full rounded-md bg-black/20 border border-line px-3 py-2 text-sm text-white outline-none"
                            placeholder="e.g. uiux, summary, draft"
                            disabled={saving || deleting}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-white">
                        <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            disabled={saving || deleting}
                        />
                        Pin this note
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <div className="text-xs text-white/60">Link to Course</div>
                            <select
                                value={courseId}
                                onChange={(e) => {
                                    const next = e.target.value
                                    setCourseId(next)

                                    if (next && projectId) {
                                        const p: any = normalizedProjects.find((x) => x.id === projectId)
                                        if (p?.courseId && p.courseId !== next) setProjectId("")
                                    }
                                }}
                                className="w-full rounded-md bg-black/20 border border-line px-3 py-2 text-sm text-white outline-none"
                                disabled={saving || deleting}
                            >
                                <option value="">None</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-white/60">Link to Project</div>
                            <select
                                value={projectId}
                                onChange={(e) => {
                                    const next = e.target.value
                                    setProjectId(next)

                                    const p: any = normalizedProjects.find((x) => x.id === next)
                                    if (p?.courseId) setCourseId(p.courseId)
                                }}
                                className="w-full rounded-md bg-black/20 border border-line px-3 py-2 text-sm text-white outline-none"
                                disabled={saving || deleting}
                            >
                                <option value="">None</option>
                                {visibleProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {confirmDeleteOpen ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                            <div className="text-sm text-white">
                                Delete <span className="font-semibold">"{note.title || "Untitled"}"</span>?
                            </div>
                            <div className="mt-1 text-xs text-white/60">This action cannot be undone.</div>

                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-md border border-line text-xs text-white hover:bg-white/5 disabled:opacity-60"
                                    disabled={deleting}
                                    onClick={() => setConfirmDeleteOpen(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-md bg-red-600 text-xs text-white hover:bg-red-500 disabled:opacity-60"
                                    disabled={deleting}
                                    onClick={handleConfirmDelete}
                                >
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => !deleting && onClose()}
                            className="px-3 py-1.5 rounded-md border border-line text-xs text-white hover:bg-white/5 disabled:opacity-60"
                            disabled={saving || deleting}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setConfirmDeleteOpen(true)
                            }}
                            className="px-3 py-1.5 rounded-md border border-red-500/40 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                            disabled={saving || deleting}
                        >
                            Delete
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenCanvas}
                            className="px-3 py-1.5 rounded-md border border-line text-xs text-white hover:bg-white/5 disabled:opacity-60"
                            disabled={saving || deleting}
                        >
                            Open Canvas
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-1.5 rounded-md bg-blue-600 text-xs text-white hover:bg-blue-500 disabled:opacity-60"
                            disabled={saving || deleting}
                        >
                            Save
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}