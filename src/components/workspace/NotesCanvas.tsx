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

/**
 * -----------------------------
 * Utilities
 * -----------------------------
 */

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

async function blobToDataUrl(blob: Blob) {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * ✅ Offline image store (stores base64 inside snapshot)
 */
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

/**
 * -----------------------------
 * Self-hosted tldraw assets
 * -----------------------------
 */
const baseAssetUrls = getAssetUrls({ baseUrl: "/tldraw" })

/**
 * ✅ Override default tldraw fonts (the 4 built-in families)
 * If you ONLY want to override mono, delete the other keys.
 */
const assetUrls = {
    ...baseAssetUrls,
    fonts: {
        ...(baseAssetUrls as any).fonts,
        // Your wish: make tldraw_mono use Google Sans Code
        tldraw_mono: "/fonts/GoogleSansCode-Regular.woff2",

        // Optional: if you want sans to be Google Sans
        tldraw_sans: "/fonts/GoogleSans-Regular.woff2",

        // Optional: keep these default unless you really want to change them:
        // tldraw_serif: "/fonts/SomeSerif.woff2",
        // tldraw_draw: "/fonts/SomeDraw.woff2",
    },
}

/**
 * -----------------------------
 * Rich text font dropdown (TipTap)
 * -----------------------------
 *
 * We map:
 *   family -> style(normal/italic) -> weight(normal/bold) -> TLFontFace
 *
 * tldraw’s rich text font tracking uses this to know what to preload and export. :contentReference[oaicite:2]{index=2}
 */
const extensionFontFamilies: Record<
    string,
    Record<string, Record<string, TLFontFace>>
> = {
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

    "Google Sans": {
        normal: {
            normal: {
                family: "Google Sans",
                src: { url: "/fonts/GoogleSans-Medium.woff2", format: "woff2" },
                weight: "500",
                style: "normal",
            },
            bold: {
                family: "Google Sans",
                src: { url: "/fonts/GoogleSans-Bold.woff2", format: "woff2" },
                weight: "700",
                style: "normal",
            },
        },
        italic: {
            normal: {
                family: "Google Sans",
                src: { url: "/fonts/GoogleSans-MediumItalic.woff2", format: "woff2" },
                weight: "500",
                style: "italic",
            },
            bold: {
                family: "Google Sans",
                src: { url: "/fonts/GoogleSans-BoldItalic.woff2", format: "woff2" },
                weight: "700",
                style: "italic",
            },
        },
    },

    "Google Sans Code": {
        normal: {
            normal: {
                family: "Google Sans Code",
                src: { url: "/fonts/GoogleSansCode-Regular.woff2", format: "woff2" },
                weight: "400",
                style: "normal",
            },
            // you don’t have a bold file, so we still map bold to regular (browser may synthesize)
            bold: {
                family: "Google Sans Code",
                src: { url: "/fonts/GoogleSansCode-Regular.woff2", format: "woff2" },
                weight: "700",
                style: "normal",
            },
        },
        italic: {
            normal: {
                family: "Google Sans Code",
                src: { url: "/fonts/GoogleSansCode-Italic.woff2", format: "woff2" },
                weight: "400",
                style: "italic",
            },
            bold: {
                family: "Google Sans Code",
                src: { url: "/fonts/GoogleSansCode-Italic.woff2", format: "woff2" },
                weight: "700",
                style: "italic",
            },
        },
    },

    "Consolas": {
        normal: {
            normal: {
                family: "Consolas",
                src: { url: "/fonts/Consolas.woff2", format: "woff2" },
                weight: "400",
                style: "normal",
            },
            bold: {
                family: "Consolas",
                src: { url: "/fonts/Consolas-Bold.woff2", format: "woff2" },
                weight: "700",
                style: "normal",
            },
        },
        italic: {
            normal: {
                family: "Consolas",
                src: { url: "/fonts/Consolas-Italic.woff2", format: "woff2" },
                weight: "400",
                style: "italic",
            },
            bold: {
                family: "Consolas",
                src: { url: "/fonts/Consolas-BoldItalic.woff2", format: "woff2" },
                weight: "700",
                style: "italic",
            },
        },
    },

    "SusahKali": {
        normal: {
            normal: {
                family: "SusahKali",
                src: { url: "/fonts/SusahKali.woff2", format: "woff2" },
                weight: "400",
                style: "normal",
            },
            bold: {
                family: "SusahKali",
                src: { url: "/fonts/SusahKali.woff2", format: "woff2" },
                weight: "700",
                style: "normal",
            },
        },
        italic: {
            normal: {
                family: "SusahKali",
                src: { url: "/fonts/SusahKali.woff2", format: "woff2" },
                weight: "400",
                style: "italic",
            },
            bold: {
                family: "SusahKali",
                src: { url: "/fonts/SusahKali.woff2", format: "woff2" },
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

/**
 * Optional font sizes.
 * You can add/remove whatever you want.
 */
const fontSizeOptions = [
    { label: "Small", value: "12px" },
    { label: "Normal", value: "16px" },
    { label: "Large", value: "20px" },
    { label: "X-Large", value: "24px" },
    { label: "XX-Large", value: "28px" },
    { label: "Huge", value: "32px" },
]

/**
 * Custom toolbar (adds font dropdown + keeps default toolbar items)
 * Pattern from tldraw example. :contentReference[oaicite:3]{index=3}
 */
const components: TLComponents = {
    RichTextToolbar: () => {
        const editor = useEditor()
        const textEditor = useValue(
            "textEditor",
            () => editor.getRichTextEditor(),
            [editor]
        )
        const [, setTextEditorState] = useState<TextEditorState | null>(
            textEditor?.state ?? null
        )

        useEffect(() => {
            if (!textEditor) {
                setTextEditorState(null)
                return
            }

            const handleTransaction = ({
                                           editor: te,
                                       }: TextEditorEvents["transaction"]) => {
                setTextEditorState(te.state)
            }

            textEditor.on("transaction", handleTransaction)
            return () => {
                textEditor.off("transaction", handleTransaction)
                setTextEditorState(null)
            }
        }, [textEditor])

        if (!textEditor) return null

        const currentFontFamily =
            textEditor.getAttributes("textStyle").fontFamily ?? "DEFAULT"
        const currentFontSize = textEditor.getAttributes("textStyle").fontSize ?? ""

        return (
            <DefaultRichTextToolbar>
                <select
                    className="mx-2 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100"
                    value={currentFontFamily}
                    onPointerDown={editor.markEventAsHandled}
                    onChange={(e) => {
                        const v = e.target.value
                        if (v === "DEFAULT") {
                            // TipTap provides unsetFontFamily when using FontFamily extension
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
                    className="mx-2 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100"
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

/**
 * This tells tldraw how to detect & preload fonts from rich text nodes.
 * Official pattern. :contentReference[oaicite:4]{index=4}
 */
const textOptions: Partial<TLTextOptions> = {
    tipTapConfig: {
        extensions: [...tipTapDefaultExtensions, FontFamily, TextStyleKit],
    },
    addFontsFromNode(node, state, addFont) {
        state = defaultAddFontsFromNode(node, state, addFont)

        // Track fontFamily marks down the tree
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

        // Add our custom font face if it matches current style/weight
        const font = extensionFontFamilies[state.family]?.[state.style]?.[state.weight]
        if (font) addFont(font)

        return state
    },
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

    // Precompute all font faces for preloading
    const allExtensionFontFaces = useMemo(() => {
        return Object.values(extensionFontFamilies)
            .flatMap((family) => Object.values(family))
            .flatMap((style) => Object.values(style))
    }, [])

    const onMount = useCallback(
        (editor: Editor) => {
            // Preload custom fonts so switching doesn’t flash
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

    // @ts-ignore
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
                <Tldraw
                    store={store}
                    assetUrls={assetUrls}
                    assets={assets}
                    components={components}
                    textOptions={textOptions}
                    onMount={onMount}
                />
            </div>
        </div>
    )
}
