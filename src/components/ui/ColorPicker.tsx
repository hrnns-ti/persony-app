import { useEffect, useMemo, useState } from 'react';

type Props = {
    label?: string;
    value: string;
    onChange: (color: string) => void;
    storageKey: string;
    max?: number;
    className?: string;
};

function readColors(storageKey: string): string[] {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeColors(storageKey: string, colors: string[]) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(colors));
    } catch {
        // ignore
    }
}

export default function SavedColorPicker({
                                             label = 'Color',
                                             value,
                                             onChange,
                                             storageKey,
                                             max = 10,
                                             className = '',
                                         }: Props) {
    const [savedColors, setSavedColors] = useState<string[]>(() =>
        typeof window === 'undefined' ? [] : readColors(storageKey)
    );

    const normalizedValue = useMemo(() => (value || '#6366f1').toLowerCase(), [value]);

    useEffect(() => {
        const sync = () => setSavedColors(readColors(storageKey));

        const onStorage = (e: StorageEvent) => {
            if (e.key === storageKey) sync();
        };

        const onCustom = (e: Event) => {
            const detail = (e as CustomEvent).detail as { key?: string } | undefined;
            if (detail?.key === storageKey) sync();
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener('saved-colors:update', onCustom);

        sync();

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('saved-colors:update', onCustom);
        };
    }, [storageKey]);

    function persist(next: string[]) {
        setSavedColors(next);
        writeColors(storageKey, next);

        window.dispatchEvent(new CustomEvent('saved-colors:update', { detail: { key: storageKey } }));
    }

    function handleSaveCurrentColor() {
        const c = normalizedValue;
        persist([c, ...savedColors.filter((x) => x.toLowerCase() !== c)].slice(0, max));
    }

    function handleRemoveSavedColor(color: string) {
        persist(savedColors.filter((x) => x.toLowerCase() !== color.toLowerCase()));
    }

    return (
        <div className={`space-y-1 ${className}`}>
            <label className="text-xs text-slate-400">{label}</label>

            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={normalizedValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-14 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                />
                <button
                    type="button"
                    onClick={handleSaveCurrentColor}
                    className="px-2 py-1 text-[11px] rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                    Save color
                </button>
            </div>

            {savedColors.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {savedColors.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onChange(c)}
                            className="relative h-6 w-6 rounded-full border border-slate-700"
                            style={{ backgroundColor: c }}
                            title={c}
                        >
                              <span
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSavedColor(c);
                                  }}
                                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-slate-900 text-[9px] text-slate-300 flex items-center justify-center border border-slate-600 hover:bg-red-600 hover:text-white cursor-pointer"
                              >
                                ×
                              </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
