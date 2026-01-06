const SAVED_PROJECT_COLORS_KEY = 'persony_saved_project_colors';

export type SavedColors = string[];

export function loadSavedProjectColors(): SavedColors {
    const raw = localStorage.getItem(SAVED_PROJECT_COLORS_KEY);
    if (!raw) {
        return ['#6366f1', '#22c55e', '#eab308']; // default favorites
    }
    try {
        return JSON.parse(raw) as string[];
    } catch {
        return ['#6366f1', '#22c55e', '#eab308'];
    }
}

export function addSavedProjectColor(color: string): SavedColors {
    const existing = loadSavedProjectColors();
    if (existing.includes(color)) return existing;

    const updated = [...existing, color];
    localStorage.setItem(SAVED_PROJECT_COLORS_KEY, JSON.stringify(updated));
    return updated;
}

export function removeSavedProjectColor(color: string): SavedColors {
    const existing = loadSavedProjectColors().filter((c) => c !== color);
    localStorage.setItem(SAVED_PROJECT_COLORS_KEY, JSON.stringify(existing));
    return existing;
}
