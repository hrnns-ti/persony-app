import { getCurrentWindow } from "@tauri-apps/api/window";

export default function TitleBar() {
    const win = getCurrentWindow();

    return (
        <div
            className="h-10 flex justify-center rounded-md items-center w-40 gap-1 px-2 border-line select-none"
            data-tauri-drag-region
        >
            <button
                type="button"
                onClick={() => win.minimize()}
                className="w-10 h-7 rounded-md border border-line text-slate-200 hover:bg-line"
                aria-label="Minimize"
            >
                —
            </button>

            <button
                type="button"
                onClick={() => win.toggleMaximize()}
                className="w-10 h-7 rounded-md border border-line text-slate-200 hover:bg-line"
                aria-label="Maximize"
            >
                □
            </button>

            <button
                type="button"
                onClick={() => win.close()}
                className="w-10 h-7 rounded-md border border-line text-slate-200 hover:bg-red hover:border-red"
                aria-label="Close"
            >
                ×
            </button>
        </div>
    );
}
