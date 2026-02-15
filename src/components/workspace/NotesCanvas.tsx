import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    DefaultRichTextToolbar,
    DefaultRichTextToolbarContent,
    DefaultSpinner,
    Tldraw,
    createTLStore,
    defaultAddFontsFromNode,
    getSnapshot,
    loadSnapshot,
    tipTapDefaultExtensions,
    type Editor,
    type TLAssetStore,
    type TLComponents,
    type TLFontFace,
    type TLTextOptions,
    type TLEditorSnapshot,
    useEditor,
    useValue,
} from "tldraw"
import "tldraw/tldraw.css"

import { EditorEvents as TextEditorEvents } from "@tiptap/core"
import { FontFamily } from "@tiptap/extension-font-family"
import { TextStyleKit } from "@tiptap/extension-text-style"
import { EditorState as TextEditorState } from "@tiptap/pm/state"

import { getAssetUrls } from "@tldraw/assets/selfHosted"
import { noteService } from "../../services/workspace.service/note"

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

    ;(wrapped as any).flush = () => {
        if (timeout) clearTimeout(timeout)
        timeout = null
        last = Date.now()
        if (lastArgs) fn(...lastArgs)
    }

    ;(wrapped as any).cancel = () => {
        if (timeout) clearTimeout(timeout)
        timeout = null
        lastArgs = null
    }

    return wrapped as T & { cancel: () => void; flush: () => void }
}

async function blobToDataUrl(blob: Blob) {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

const assets: TLAssetStore = {
    async upload(_asset, file) {
        const src = await blobToDataUrl(file)
        return { src }
    },
    async resolve(asset) {
        return asset.props.src
    },
    async remove(_assetIds) {},
}

const baseAssetUrls = getAssetUrls({ baseUrl: "/tldraw" })

const assetUrls = {
    ...baseAssetUrls,
    fonts: {
        ...(baseAssetUrls as any).fonts,
        tldraw_mono: "/fonts/GoogleSansCode-Regular.woff2",
        tldraw_sans: "/fonts/GoogleSans-Regular.woff2",
    },
}

const extensionFontFamilies: Record<string, Record<string, Record<string, TLFontFace>>> = {
    "Inter": {
        normal: {
            normal: {
                family: "Inter",
                src: { url: "/fonts/Inter-Medium.woff2", format: "woff2" },
                weight: "500",
                style: "normal",
            },
            bold: {
                family: "Inter",
                src: { url: "/fonts/Inter-Bold.woff2", format: "woff2" },
                weight: "700",
                style: "normal",
            },
        },
        italic: {
            normal: {
                family: "Inter",
                src: { url: "/fonts/Inter-MediumItalic.woff2", format: "woff2" },
                weight: "500",
                style: "italic",
            },
            bold: {
                family: "Inter",
                src: { url: "/fonts/Inter-BoldItalic.woff2", format: "woff2" },
                weight: "700",
                style: "italic",
            },
        },
    },
}

const fontOptions = [
    { label: "Default", value: "DEFAULT" },
    ...Object.keys(extensionFontFamilies).map((family) => ({
        label: family,
        value: family,
    })),
]

const fontSizeOptions = [
    { label: "Small", value: "12px" },
    { label: "Normal", value: "16px" },
    { label: "Large", value: "20px" },
    { label: "X-Large", value: "24px" },
    { label: "XX-Large", value: "28px" },
    { label: "Huge", value: "32px" },
]

const components: TLComponents = {
    RichTextToolbar: () => {
        const editor = useEditor()
        const textEditor = useValue("textEditor", () => editor.getRichTextEditor(), [editor])
        const [, setTextEditorState] = useState<TextEditorState | null>(textEditor?.state ?? null)

        useEffect(() => {
            if (!textEditor) {
                setTextEditorState(null)
                return
            }

            const handleTransaction = ({ editor: te }: TextEditorEvents["transaction"]) => {
                setTextEditorState(te.state)
            }

            textEditor.on("transaction", handleTransaction)
            return () => {
                textEditor.off("transaction", handleTransaction)
                setTextEditorState(null)
            }
        }, [textEditor])

        if (!textEditor) return null

        const currentFontFamily = textEditor.getAttributes("textStyle").fontFamily ?? "DEFAULT"
        const currentFontSize = textEditor.getAttributes("textStyle").fontSize ?? ""

        return (
            <DefaultRichTextToolbar>
                <select
                    className=" rounded-md mx-2 px-2 py-1 text-xs"
                    value={currentFontFamily}
                    onPointerDown={editor.markEventAsHandled}
                    onChange={(e) => {
                        const v = e.target.value
                        if (v === "DEFAULT") {
                            ;(textEditor as any)?.chain().focus().unsetFontFamily().run()
                        } else {
                            ;(textEditor as any)?.chain().focus().setFontFamily(v).run()
                        }
                    }}
                >
                    {fontOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <select
                    className=" rounded-md px-2 mx-2 py-1 text-xs"
                    value={currentFontSize}
                    onPointerDown={editor.markEventAsHandled}
                    onChange={(e) => {
                        const v = e.target.value
                        if (!v) return
                            ;(textEditor as any)?.chain().focus().setMark("textStyle", { fontSize: v }).run()
                    }}
                >
                    <option value="">Size</option>
                    {fontSizeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <DefaultRichTextToolbarContent textEditor={textEditor} />
            </DefaultRichTextToolbar>
        )
    },
}

const textOptions: Partial<TLTextOptions> = {
    tipTapConfig: {
        extensions: [...tipTapDefaultExtensions, FontFamily, TextStyleKit],
    },
    addFontsFromNode(node, state, addFont) {
        state = defaultAddFontsFromNode(node, state, addFont)

        for (const mark of node.marks) {
            if (
                mark.type.name === "textStyle" &&
                mark.attrs.fontFamily &&
                mark.attrs.fontFamily !== "DEFAULT" &&
                mark.attrs.fontFamily !== state.family
            ) {
                state = { ...state, family: mark.attrs.fontFamily }
            }
        }

        const font = extensionFontFamilies[state.family]?.[state.style]?.[state.weight]
        if (font) addFont(font)

        return state
    },
}

type NotesCanvasProps = {
    noteId: string
    onBack: () => void
    onUpdateNote?: (id: string, patch: any) => Promise<any>
}

export default function NotesCanvas({ noteId, onBack, onUpdateNote }: NotesCanvasProps) {
    const store = useMemo(() => createTLStore(), [])
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("Untitled")
    const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved")
    const readyRef = useRef(false)

    const allExtensionFontFaces = useMemo(() => {
        return Object.values(extensionFontFamilies)
            .flatMap((family) => Object.values(family))
            .flatMap((style) => Object.values(style))
    }, [])

    const saveNote = useCallback(
        (patch: any) => {
            if (onUpdateNote) return onUpdateNote(noteId, patch)
            return noteService.update(noteId, patch)
        },
        [noteId, onUpdateNote]
    )

    const onMount = useCallback(
        (editor: Editor) => {
            editor.fonts.requestFonts(allExtensionFontFaces)
        },
        [allExtensionFontFaces]
    )

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
                        if (parsed && typeof parsed === "object" && "document" in parsed) {
                            loadSnapshot(store, parsed as Partial<TLEditorSnapshot>)
                        } else {
                            loadSnapshot(store, parsed as TLEditorSnapshot)
                        }
                    } catch {
                        // ignore
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

    const persistRef = useRef<null | ReturnType<typeof throttle>>(null)

    useEffect(() => {
        const persist = throttle(async () => {
            if (!readyRef.current) return
            try {
                setSaveState("saving")
                const snapshot = getSnapshot(store)
                await saveNote({ content: JSON.stringify(snapshot) })
                setSaveState("saved")
            } catch {
                setSaveState("error")
            }
        }, 1200)

        persistRef.current = persist
        const unlisten = store.listen(() => persist())

        return () => {
            unlisten()
            persist.flush()
            persistRef.current = null
        }
    }, [store, saveNote])

    // Title save (throttled)
    const saveTitle = useMemo(
        () =>
            throttle(async (nextTitle: string) => {
                try {
                    await saveNote({ title: nextTitle })
                } catch {
                    // ignore
                }
            }, 400),
        [saveNote]
    )

    if (loading) {
        return (
            <div className="fixed inset-0 z-[999] grid place-items-center bg-zinc-950">
                <DefaultSpinner />
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[999] bg-zinc-950">
            <div className="absolute top-12 border z-50 flex items-center bg-gray-200 gap-3 rounded-br-xl rounded-tr-xl px-3 py-2 ">
                <button
                    type="button"
                    onClick={() => {
                        saveTitle.flush()
                        persistRef.current?.flush()
                        onBack()
                    }}
                    className="rounded-md border border-zinc-800 px-3 py-1 text-sm hover:bg-zinc-300"
                >
                    Back
                </button>

                <div className="flex flex-col gap-0.5">
                    <input
                        value={title}
                        onChange={(e) => {
                            const next = e.target.value
                            setTitle(next)
                            saveTitle(next)
                        }}
                        className="w-[260px] rounded-md bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-zinc-300/40 focus:bg-zinc-300/60"
                    />
                    <div className="px-2 text-xs text-zinc-400">
                        {saveState === "saved" && "Saved"}
                        {saveState === "saving" && "Saving…"}
                        {saveState === "error" && "Save failed"}
                    </div>
                </div>
            </div>

            <div className="h-full w-full">
                <Tldraw
                    store={store}
                    assetUrls={assetUrls}
                    // @ts-ignore
                    assets={assets}
                    components={components}
                    textOptions={textOptions}
                    onMount={onMount}
                />
            </div>
        </div>
    )
}
