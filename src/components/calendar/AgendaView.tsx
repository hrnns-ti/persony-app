import type { EventInstance } from "../../types/calendar";

function dayKey(iso: string) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

export default function AgendaView(props: {
    instances: EventInstance[];
    onClickEvent: (ev: EventInstance) => void;
}) {
    const { instances, onClickEvent } = props;

    const sorted = [...instances].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const groups = new Map<string, EventInstance[]>();
    for (const ev of sorted) {
        const k = dayKey(ev.start);
        const arr = groups.get(k) ?? [];
        arr.push(ev);
        groups.set(k, arr);
    }

    const keys = [...groups.keys()].sort();

    return (
        <div className="border border-line rounded-lg bg-main overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto savings-scroll p-3 space-y-4">
                {keys.length === 0 && <p className="text-xs text-slate-500">No events.</p>}

                {keys.map((k) => (
                    <div key={k}>
                        <div className="text-xs font-semibold text-slate-300 mb-2">
                            {new Date(k).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </div>

                        <div className="space-y-2">
                            {groups.get(k)!.map((ev) => (
                                <button
                                    key={ev.instanceId}
                                    onClick={() => onClickEvent(ev)}
                                    className="w-full text-left border border-line rounded-md p-3 hover:border-slate-600"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm text-slate-100 font-semibold truncate">
                                                <span className="inline-block h-2 w-2 rounded-full mr-2 align-middle" style={{ backgroundColor: ev.color ?? "#3b82f6" }} />
                                                {ev.title}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-1">
                                                {ev.allDay
                                                    ? "All day"
                                                    : `${new Date(ev.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(ev.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-slate-500">{ev.status}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}