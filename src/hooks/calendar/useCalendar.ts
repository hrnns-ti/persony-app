import { useCallback, useEffect, useMemo, useState } from "react";
import type { Calendar, CalendarCreateInput, CalendarUpdatePatch } from "../../types/calendar";
import calendarService from "../../services/calendar.service/calendar";

const STORAGE_KEY = "calendar.visibleCalendarIds.v1";

function loadVisibleIds(): string[] | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : null;
    } catch {
        return null;
    }
}

function saveVisibleIds(ids: string[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        // ignore
    }
}

export function useCalendars() {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const visibleSet = useMemo(() => new Set(visibleCalendarIds), [visibleCalendarIds]);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // ensure ada minimal 1 calendar (Personal)
            await calendarService.ensureDefault();

            const data = await calendarService.getAll();
            setCalendars(data);

            const stored = loadVisibleIds();
            if (stored && stored.length) {
                // keep only existing ids
                const valid = stored.filter((id) => data.some((c) => c.id === id));
                const finalIds = valid.length ? valid : data.map((c) => c.id);
                setVisibleCalendarIds(finalIds);
                saveVisibleIds(finalIds);
            } else {
                const allIds = data.map((c) => c.id);
                setVisibleCalendarIds(allIds);
                saveVisibleIds(allIds);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load calendars");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const toggleCalendarVisibility = useCallback((id: string) => {
        setVisibleCalendarIds((prev) => {
            const exists = prev.includes(id);
            const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
            saveVisibleIds(next);
            return next;
        });
    }, []);

    const showAll = useCallback(() => {
        setVisibleCalendarIds(() => {
            const all = calendars.map((c) => c.id);
            saveVisibleIds(all);
            return all;
        });
    }, [calendars]);

    const hideAll = useCallback(() => {
        setVisibleCalendarIds(() => {
            saveVisibleIds([]);
            return [];
        });
    }, []);

    const addCalendar = useCallback(async (input: CalendarCreateInput) => {
        const created = await calendarService.add(input);
        setCalendars((prev) => {
            const next = [...prev, created].sort((a, b) => {
                const ap = a.isPrimary ? 0 : 1;
                const bp = b.isPrimary ? 0 : 1;
                if (ap !== bp) return ap - bp;
                return a.title.localeCompare(b.title);
            });
            return next;
        });
        // default: new calendar visible
        setVisibleCalendarIds((prev) => {
            if (prev.includes(created.id)) return prev;
            const next = [...prev, created.id];
            saveVisibleIds(next);
            return next;
        });
        return created;
    }, []);

    const updateCalendar = useCallback(async (id: string, patch: CalendarUpdatePatch) => {
        const updated = await calendarService.update(id, patch);
        if (!updated) return null;

        // kalau jadi primary, service sudah reset yang lain, maka refresh list biar konsisten
        const needsRefreshPrimary = patch.isPrimary === true;

        if (needsRefreshPrimary) {
            await refresh();
            return updated;
        }

        setCalendars((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
    }, [refresh]);

    const removeCalendar = useCallback(async (id: string) => {
        await calendarService.remove(id);
        setCalendars((prev) => prev.filter((c) => c.id !== id));
        setVisibleCalendarIds((prev) => {
            const next = prev.filter((x) => x !== id);
            saveVisibleIds(next);
            return next;
        });
    }, []);

    return {
        calendars,
        visibleCalendarIds,
        visibleSet,
        loading,
        error,
        refresh,
        toggleCalendarVisibility,
        showAll,
        hideAll,
        addCalendar,
        updateCalendar,
        removeCalendar,
    };
}