import type { EventInstance } from "../../types/calendar";

function startOfMonthGrid(date: Date, weekStartsOnMonday = true) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = first.getDay(); // 0 Sun .. 6 Sat
    const weekStart = weekStartsOnMonday ? 1 : 0;
    const diff = (day - weekStart + 7) % 7;
    first.setDate(first.getDate() - diff);
    first.setHours(0, 0, 0, 0);
    return first;
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function key(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function isSameMonth(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function MonthView(props: {
    activeDate: Date;
    byDay: Map<string, EventInstance[]>;
    onClickDay: (day: Date) => void;
    onClickEvent: (instance: EventInstance) => void;
}) {
    const { activeDate, byDay, onClickDay, onClickEvent } = props;

    const gridStart = startOfMonthGrid(activeDate, true);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="border border-line rounded-lg overflow-hidden bg-main flex flex-col min-h-0 h-full">
            <div className="grid grid-cols-7 border-b border-line bg-main">
                {labels.map((l) => (
                    <div key={l} className="px-3 py-2 text-[11px] text-slate-400">
                        {l}
                    </div>
                ))}
            </div>

            {/* IMPORTANT: yang ini yang bikin month bisa scroll saat viewport pendek */}
            <div className="flex-1 min-h-0 overflow-auto savings-scroll">
                <div className="grid grid-cols-7 grid-rows-6 min-h-[660px]">
                    {days.map((d) => {
                        const k = key(d);
                        const list = byDay.get(k) ?? [];
                        const dim = !isSameMonth(d, activeDate);

                        return (
                            <div
                                key={k}
                                className={`border-t border-l border-line p-2 min-h-[110px] cursor-pointer hover:bg-slate-900/30 ${
                                    dim ? "opacity-60" : ""
                                }`}
                                onClick={() => onClickDay(d)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-300">{d.getDate()}</span>
                                </div>

                                <div className="mt-2 space-y-1">
                                    {list.slice(0, 3).map((ev) => (
                                        <button
                                            key={ev.instanceId}
                                            className="w-full text-left text-[11px] px-2 py-1 rounded-md border border-line hover:border-slate-600 truncate"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClickEvent(ev);
                                            }}
                                            title={ev.title}
                                        >
                      <span
                          className="inline-block h-2 w-2 rounded-full mr-2 align-middle"
                          style={{ backgroundColor: ev.color ?? "#3b82f6" }}
                      />
                                            <span className="align-middle">{ev.title}</span>
                                        </button>
                                    ))}

                                    {list.length > 3 && <div className="text-[11px] text-slate-500 px-2">+{list.length - 3} more</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}