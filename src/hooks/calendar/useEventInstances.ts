import { useCallback, useMemo, useState } from "react";
import type { EventInstance } from "../../types/calendar";
import { useEvents } from "./useEvents";
import exceptionService from "../../services/calendar.service/exception";
import { expandEventsToInstances } from "../../services/calendar.service/recurrence";

function dayKeyFromISO(iso: string) {
    // ISO -> local day key (YYYY-MM-DD)
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

export function useEventInstances() {
    const { events, loading: eventsLoading, error: eventsError, loadForRange, addEvent, updateEvent, removeEvent } =
        useEvents();

    const [instances, setInstances] = useState<EventInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInstancesForRange = useCallback(
        async (rangeStartISO: string, rangeEndISO: string, calendarIds?: string[]) => {
            try {
                setLoading(true);
                setError(null);

                const evs = await loadForRange(rangeStartISO, rangeEndISO, calendarIds);
                const ids = evs.map((e) => e.id);

                // exceptions optional (stub recurrence akan ignore)
                const ex = ids.length
                    ? await exceptionService.getForRange(rangeStartISO, rangeEndISO, ids)
                    : [];

                const inst = expandEventsToInstances(evs, ex, rangeStartISO, rangeEndISO);
                setInstances(inst);
                return inst;
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load instances");
                setInstances([]);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [loadForRange]
    );

    const byDay = useMemo(() => {
        const map = new Map<string, EventInstance[]>();
        for (const it of instances) {
            const key = dayKeyFromISO(it.start);
            const arr = map.get(key) ?? [];
            arr.push(it);
            map.set(key, arr);
        }
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
            map.set(k, arr);
        }
        return map;
    }, [instances]);

    return {
        events,
        instances,
        byDay,
        loading: loading || eventsLoading,
        error: error ?? eventsError,
        loadInstancesForRange,
        addEvent,
        updateEvent,
        removeEvent,
    };
}