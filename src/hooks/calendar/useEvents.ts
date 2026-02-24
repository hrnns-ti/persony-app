import { useCallback, useState } from "react";
import type { CalendarEvent, EventCreateInput, EventUpdatePatch } from "../../types/calendar";
import eventService from "../../services/calendar.service/event";

export function useEvents() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadForRange = useCallback(
        async (rangeStartISO: string, rangeEndISO: string, calendarIds?: string[]) => {
            try {
                setLoading(true);
                setError(null);
                const data = await eventService.getForRange(rangeStartISO, rangeEndISO, calendarIds);
                setEvents(data);
                return data;
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load events");
                return [];
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const addEvent = useCallback(async (input: EventCreateInput) => {
        const created = await eventService.add(input);
        setEvents((prev) => [...prev, created]);
        return created;
    }, []);

    const updateEvent = useCallback(async (id: string, patch: EventUpdatePatch) => {
        const updated = await eventService.update(id, patch);
        if (!updated) return null;
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
    }, []);

    const removeEvent = useCallback(async (id: string) => {
        await eventService.remove(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
    }, []);

    return {
        events,
        loading,
        error,
        loadForRange,
        addEvent,
        updateEvent,
        removeEvent,
    };
}