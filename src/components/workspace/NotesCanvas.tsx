import { useEffect, useMemo, useRef, useState } from "react"
import {
    DefaultSpinner,
    Tldraw,
    createTLStore,
    getSnapshot,
    loadSnapshot,
    type TLEditorSnapshot,
    type TLAssetStore,
} from "tldraw"
import "tldraw/tldraw.css"

import { getAssetUrls } from "@tldraw/assets/selfHosted"
import { noteService } from "../../services/workspace.service/note"

const assetUrls = getAssetUrls({ baseUrl: "/tldraw" })

function throttle<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
    let last = 0
    let timeout: ReturnType<typeof setTimeout> | null = null
    let lastArgs: any[] | null = null

    const wrapped = (...args: any[]) => {
            const now = Date.now()
            const remaining = waitMs - (now - last)
            lastArgs = args

            if (remaining <= 0) {
                if (timeout) clearTimeout(timeout)
                timeout = null
                last = now
                fn(...args)
                return
            }

            if (!timeout) {
                timeout = setTimeout(() => {
                    last = Date.now()
                    timeout = null
                    if (lastArgs) fn(...lastArgs)
                }, remaining)
            }
        }

    ;(wrapped as any).cancel = () => {
        if (timeout) clearTimeout(timeout)
        timeout = null
        lastArgs = null
    }

    return wrapped as T & { cancel: () => void }
}

async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

// ✅ offline image store (base64 in snapshot)
const assets: TLAssetStore = {
    async upload(_asset, file) {
        const src = await fileToDataUrl(file)
        return { src }
    },
    async resolve(asset) {
        return asset.props.src
    },
    async remove(_assetIds) {},
}

type NotesCanvasProps = {
    noteId: string
    onBack: () => void
}

export default function NotesCanvas({ noteId, onBack }: NotesCanvasProps) {
    const store = useMemo(() => createTLStore(), [])
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("Untitled")
    const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved")
    const readyRef = useRef(false)

    // Load note snapshot
    useEffect(() => {
        let mounted = true

        ;(async () => {
            setLoading(true)
            readyRef.current = false
            try {
                const note = await noteService.getById(noteId)
                if (!mounted) return

                if (!note) {
                    setTitle("Not found")
                    setLoading(false)
                    return
                }

                setTitle(note.title || "Untitled")

                if (note.content) {
                    try {
                        const parsed = JSON.parse(note.content)

                        // Backward compatible with older `{ document: ... }` format:
                        if (parsed && typeof parsed === "object" && "document" in parsed) {
                            loadSnapshot(store, parsed as Partial<TLEditorSnapshot>)
                        } else {
                            loadSnapshot(store, parsed as TLEditorSnapshot)
                        }
                    } catch {
                        // ignore plain text
                    }
                }

                setLoading(false)
                readyRef.current = true
            } catch (e) {
                console.error(e)
                setSaveState("error")
                setLoading(false)
            }
        })()

        return () => {
            mounted = false
        }
    }, [noteId, store])

    // Autosave snapshot
    useEffect(() => {
        const persist = throttle(async () => {
            if (!readyRef.current) return
            try {
                setSaveState("saving")
                const snapshot = getSnapshot(store)
                await noteService.update(noteId, { content: JSON.stringify(snapshot) })
                setSaveState("saved")
            } catch {
                setSaveState("error")
            }
        }, 800)

        const unlisten = store.listen(() => persist())

        return () => {
            unlisten()
            persist.cancel()
        }
    }, [noteId, store])

    // Rename
    const saveTitle = useMemo(
        () =>
            throttle(async (nextTitle: string) => {
                try {
                    await noteService.update(noteId, { title: nextTitle })
                } catch {
                    // ignore
                }
            }, 600),
        [noteId]
    )

    if (loading) {
        return (
            <div className="fixed inset-0 z-[999] grid place-items-center bg-zinc-950 text-zinc-200">
                <DefaultSpinner />
            </div>
        )
    }

    // Full-screen “page”
    return (
        <div className="fixed inset-0 z-[999] bg-zinc-950">
            <div className="absolute left-4 top-4 z-50 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 backdrop-blur">
                <button
                    onClick={onBack}
                    className="rounded-lg border border-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                    Back
                </button>

                <div className="flex flex-col gap-0.5">
                    <input
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value)
                            saveTitle(e.target.value)
                        }}
                        className="w-[260px] rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-zinc-100 outline-none hover:bg-zinc-900/40 focus:bg-zinc-900/60"
                    />
                    <div className="px-2 text-xs text-zinc-400">
                        {saveState === "saved" && "Saved"}
                        {saveState === "saving" && "Saving…"}
                        {saveState === "error" && "Save failed"}
                    </div>
                </div>
            </div>

            <div className="h-full w-full">
                <Tldraw store={store} assetUrls={assetUrls} assets={assets} />
            </div>
        </div>
    )
}