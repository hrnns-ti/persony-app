import { useMemo, useState, type FormEvent } from "react";
import type { Calendar, CalendarEvent, EventCreateInput, EventUpdatePatch } from "../../types/calendar";

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateValue(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localDateStartISO(dateStr: string) {
    // dateStr: YYYY-MM-DD, interpret local
    const [y, m, d] = dateStr.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    return dt.toISOString();
}

function localDateEndExclusiveISO(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString();
}

export default function EventForm(props: {
    calendars: Calendar[];
    initial?: CalendarEvent;
    defaultCalendarId?: string;
    defaultStartISO?: string;
    defaultEndISO?: string;
    onSubmit: (data: EventCreateInput | EventUpdatePatch) => Promise<void> | void;
    onCancel: () => void;
    submitLabel?: string;
}) {
    const { calendars, initial, defaultCalendarId, defaultStartISO, defaultEndISO, onSubmit, onCancel, submitLabel } = props;

    const initialState = useMemo(() => {
        const calId = initial?.calendarId ?? defaultCalendarId ?? calendars[0]?.id ?? "";
        const allDay = initial?.allDay ?? false;

        return {
            calendarId: calId,
            title: initial?.title ?? "",
            description: initial?.description ?? "",
            location: initial?.location ?? "",
            allDay,
            start: allDay ? toDateValue(initial?.start ?? defaultStartISO) : toDatetimeLocalValue(initial?.start ?? defaultStartISO),
            end: allDay ? toDateValue(initial?.end ?? defaultEndISO) : toDatetimeLocalValue(initial?.end ?? defaultEndISO),
            status: initial?.status ?? "confirmed",
            visibility: initial?.visibility ?? "default",
            transparency: initial?.transparency ?? "opaque",
            color: initial?.color ?? "",
        };
    }, [initial, defaultCalendarId, defaultStartISO, defaultEndISO, calendars]);

    const [form, setForm] = useState(initialState);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((p) => ({ ...p, [key]: value }));
    }

    function validate() {
        if (!form.calendarId) return "Calendar wajib dipilih.";
        if (!form.title.trim()) return "Title wajib diisi.";
        if (!form.start || !form.end) return "Start/End wajib diisi.";
        return null;
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const v = validate();
        if (v) return setError(v);

        setSaving(true);
        try {
            const calendar = calendars.find((c) => c.id === form.calendarId);
            const color = form.color.trim() || calendar?.color;

            const startISO = form.allDay ? localDateStartISO(form.start) : new Date(form.start).toISOString();
            const endISO = form.allDay ? localDateEndExclusiveISO(form.end) : new Date(form.end).toISOString();

            const payload: EventCreateInput = {
                calendarId: form.calendarId,
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                location: form.location.trim() || undefined,
                allDay: form.allDay,
                start: startISO,
                end: endISO,
                status: form.status as any,
                visibility: form.visibility as any,
                transparency: form.transparency as any,
                color: color || undefined,
            };

            await onSubmit(payload);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Calendar</label>
                <select
                    value={form.calendarId}
                    onChange={(e) => set("calendarId", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                >
                    <option value="" disabled>Select calendar</option>
                    {calendars.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Title</label>
                <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    placeholder="Event title"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="allDay"
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) => set("allDay", e.target.checked)}
                />
                <label htmlFor="allDay" className="text-xs text-slate-300">All day</label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Start</label>
                    <input
                        type={form.allDay ? "date" : "datetime-local"}
                        value={form.start}
                        onChange={(e) => set("start", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">End</label>
                    <input
                        type={form.allDay ? "date" : "datetime-local"}
                        value={form.end}
                        onChange={(e) => set("end", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Status</label>
                    <select
                        value={form.status}
                        onChange={(e) => set("status", e.target.value as any)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    >
                        <option value="confirmed">confirmed</option>
                        <option value="tentative">tentative</option>
                        <option value="cancelled">cancelled</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Visibility</label>
                    <select
                        value={form.visibility}
                        onChange={(e) => set("visibility", e.target.value as any)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    >
                        <option value="default">default</option>
                        <option value="public">public</option>
                        <option value="private">private</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Busy</label>
                    <select
                        value={form.transparency}
                        onChange={(e) => set("transparency", e.target.value as any)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                    >
                        <option value="opaque">busy</option>
                        <option value="transparent">free</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Location</label>
                    <input
                        value={form.location}
                        onChange={(e) => set("location", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                        placeholder="Optional"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Color (optional)</label>
                    <input
                        value={form.color}
                        onChange={(e) => set("color", e.target.value)}
                        className="w-full bg-secondary border border-line rounded-md px-3 py-2 text-sm text-slate-200"
                        placeholder="#3b82f6"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="w-full bg-secondary border border-line savings-scroll rounded-md px-3 py-2 text-sm text-slate-200 resize-none"
                    rows={3}
                    placeholder="Optional"
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? "Saving..." : (submitLabel ?? "Save")}
                </button>
            </div>
        </form>
    );
}