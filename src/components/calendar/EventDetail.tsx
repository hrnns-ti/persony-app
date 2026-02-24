import { useState } from "react";
import type { Calendar, CalendarEvent } from "../../types/calendar";
import EventForm from "./EventForm";

export default function EventDetail(props: {
    calendars: Calendar[];
    event: CalendarEvent;
    onClose: () => void;
    onUpdate: (id: string, patch: Partial<CalendarEvent>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const { calendars, event, onClose, onUpdate, onDelete } = props;
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (editing) {
        return (
            <EventForm
                calendars={calendars}
                initial={event}
                submitLabel="Save changes"
                onCancel={() => setEditing(false)}
                onSubmit={async (data) => {
                    await onUpdate(event.id, data as any);
                    setEditing(false);
                }}
            />
        );
    }

    const cal = calendars.find((c) => c.id === event.calendarId);

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{event.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-full border border-line">{cal?.title ?? "Calendar"}</span>
                        <span className="px-2 py-0.5 rounded-full border border-line">{event.status}</span>
                        <span className="px-2 py-0.5 rounded-full border border-line">
              {event.allDay ? "All day" : "Timed"}
            </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="h-9 w-9 grid place-items-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                    aria-label="Close"
                    title="Close"
                >
                    ✕
                </button>
            </div>

            <div className="rounded-lg border border-line bg-main p-3 space-y-2">
                <div className="text-sm text-slate-300">
                    <div className="text-xs text-slate-500">Time</div>
                    <div>
                        {new Date(event.start).toLocaleString()} — {new Date(event.end).toLocaleString()}
                    </div>
                </div>

                {event.location && (
                    <div className="text-sm text-slate-300">
                        <div className="text-xs text-slate-500">Location</div>
                        <div>{event.location}</div>
                    </div>
                )}

                {event.description && (
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">
                        <div className="text-xs text-slate-500">Description</div>
                        <div>{event.description}</div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500"
                >
                    Edit
                </button>

                {!confirmDelete ? (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="px-3 py-1.5 text-xs rounded-md border border-red-500/50 text-red-300 hover:bg-red-500/10"
                    >
                        Delete
                    </button>
                ) : (
                    <button
                        onClick={async () => {
                            await onDelete(event.id);
                            onClose();
                        }}
                        className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-500"
                    >
                        Confirm delete
                    </button>
                )}
            </div>
        </div>
    );
}