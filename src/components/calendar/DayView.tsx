import { useEffect, useMemo, useRef, useState } from "react";
import type { EventInstance } from "../../types/calendar";

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function isoFromLocalMinutes(day: Date, minutes: number) {
    const base = startOfDay(day);
    const d = new Date(base);
    d.setMinutes(minutes, 0, 0);
    return d.toISOString();
}

type LayoutItem = {
    ev: EventInstance;
    startMin: number;
    endMin: number;
    col: number;
    cols: number;
};

function buildLayout(items: Array<{ ev: EventInstance; startMin: number; endMin: number }>): LayoutItem[] {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin);

    // cluster by overlap
    const clusters: typeof sorted[] = [];
    let cluster: typeof sorted = [];
    let clusterEnd = -Infinity;

    for (const it of sorted) {
        if (!cluster.length) {
            cluster = [it];
            clusterEnd = it.endMin;
            continue;
        }
        if (it.startMin < clusterEnd) {
            cluster.push(it);
            clusterEnd = Math.max(clusterEnd, it.endMin);
        } else {
            clusters.push(cluster);
            cluster = [it];
            clusterEnd = it.endMin;
        }
    }
    if (cluster.length) clusters.push(cluster);

    const result: LayoutItem[] = [];

    for (const c of clusters) {
        // greedy column assignment
        const colEnd: number[] = [];
        const assigned: Array<{ it: (typeof c)[number]; col: number }> = [];

        for (const it of c) {
            let col = 0;
            while (col < colEnd.length && it.startMin < colEnd[col]) col++;
            if (col === colEnd.length) colEnd.push(it.endMin);
            else colEnd[col] = it.endMin;

            assigned.push({ it, col });
        }

        const cols = colEnd.length || 1;
        for (const a of assigned) {
            result.push({
                ev: a.it.ev,
                startMin: a.it.startMin,
                endMin: a.it.endMin,
                col: a.col,
                cols,
            });
        }
    }

    return result;
}

export default function DayView(props: {
    day: Date;
    instances: EventInstance[];

    onClickEvent: (ev: EventInstance) => void;

    // klik/drag kosong buat create
    onCreateRange: (startISO: string, endISO: string) => void;

    // drag event untuk reschedule
    onMoveEvent: (eventId: string, startISO: string, endISO: string) => void;

    startHour?: number; // default 0
    endHour?: number; // default 24
    snapMinutes?: number; // default 15
    defaultDurationMinutes?: number; // default 60
}) {
    const {
        day,
        instances,
        onClickEvent,
        onCreateRange,
        onMoveEvent,
        startHour = 0,
        endHour = 24,
        snapMinutes = 15,
        defaultDurationMinutes = 60,
    } = props;

    const HOUR_HEIGHT = 56;
    const hourCount = Math.max(1, endHour - startHour);
    const HOURS = useMemo(() => Array.from({ length: hourCount }, (_, i) => startHour + i), [hourCount, startHour]);
    const gridHeight = hourCount * HOUR_HEIGHT;

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);

    // ✅ wheel lock: scroll di grid, bukan scroll page
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            // always lock wheel to this container when pointer is inside
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel as any);
    }, []);

    const allDayEvents = useMemo(
        () => instances.filter((x) => x.allDay).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
        [instances]
    );

    const timedRaw = useMemo(() => {
        const base = startOfDay(day).getTime();
        const minBound = startHour * 60;
        const maxBound = endHour * 60;

        return instances
            .filter((x) => !x.allDay)
            .map((ev) => {
                const s = Math.floor((new Date(ev.start).getTime() - base) / 60000);
                const e = Math.floor((new Date(ev.end).getTime() - base) / 60000);
                const startMin = clamp(s, minBound, maxBound);
                const endMin = clamp(e, minBound, maxBound);
                return { ev, startMin, endMin };
            })
            .filter((x) => x.endMin > x.startMin);
    }, [instances, day, startHour, endHour]);

    // ✅ overlap layout
    const layout = useMemo(() => buildLayout(timedRaw), [timedRaw]);

    function minutesFromPointer(e: MouseEvent | React.MouseEvent) {
        const el = gridRef.current;
        if (!el) return startHour * 60;

        const rect = el.getBoundingClientRect();
        const y = (e as MouseEvent).clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
        const rawMinutes = startHour * 60 + (y / HOUR_HEIGHT) * 60;
        const snapped = Math.round(rawMinutes / snapMinutes) * snapMinutes;

        return clamp(snapped, startHour * 60, endHour * 60);
    }

    function topFromMinutes(min: number) {
        return ((min - startHour * 60) / 60) * HOUR_HEIGHT;
    }
    function heightFromMinutes(a: number, b: number) {
        return Math.max(18, ((b - a) / 60) * HOUR_HEIGHT);
    }

    // ===== Selection(create) + Drag(move) state =====
    const modeRef = useRef<"none" | "select" | "drag">("none");

    const selectStartRef = useRef(0);
    const [selection, setSelection] = useState<{ active: boolean; startMin: number; endMin: number }>({
        active: false,
        startMin: 0,
        endMin: 0,
    });

    const dragRef = useRef<{
        ev: EventInstance;
        originalStartMin: number;
        durationMin: number;
        pointerOffsetMin: number;
        moved: boolean;
        curStartMin: number;
    } | null>(null);

    const [dragPreview, setDragPreview] = useState<{ active: boolean; startMin: number; endMin: number } | null>(null);

    function beginSelect(e: React.MouseEvent) {
        if ((e.target as HTMLElement).closest("[data-event='1']")) return;

        e.preventDefault();
        modeRef.current = "select";

        const m = minutesFromPointer(e);
        selectStartRef.current = m;

        setSelection({ active: true, startMin: m, endMin: m + snapMinutes });
    }

    function beginDrag(item: LayoutItem, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        modeRef.current = "drag";

        const pointerMin = minutesFromPointer(e);
        const pointerOffsetMin = pointerMin - item.startMin;
        const durationMin = item.endMin - item.startMin;

        dragRef.current = {
            ev: item.ev,
            originalStartMin: item.startMin,
            durationMin,
            pointerOffsetMin,
            moved: false,
            curStartMin: item.startMin,
        };

        setDragPreview({ active: true, startMin: item.startMin, endMin: item.endMin });
    }

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const mode = modeRef.current;
            if (mode === "none") return;

            if (mode === "select") {
                const cur = minutesFromPointer(e);
                const start = selectStartRef.current;
                const a = Math.min(start, cur);
                const b = Math.max(start, cur);

                setSelection({ active: true, startMin: a, endMin: b });
                return;
            }

            if (mode === "drag") {
                const dr = dragRef.current;
                if (!dr) return;

                const pointerMin = minutesFromPointer(e);
                let newStart = pointerMin - dr.pointerOffsetMin;
                newStart = Math.round(newStart / snapMinutes) * snapMinutes;
                newStart = clamp(newStart, startHour * 60, endHour * 60 - dr.durationMin);

                dr.curStartMin = newStart;
                dr.moved = dr.moved || Math.abs(newStart - dr.originalStartMin) >= snapMinutes;

                setDragPreview({
                    active: true,
                    startMin: newStart,
                    endMin: newStart + dr.durationMin,
                });
            }
        };

        const onUp = () => {
            const mode = modeRef.current;
            if (mode === "none") return;

            if (mode === "select") {
                modeRef.current = "none";

                setSelection((prev) => {
                    if (!prev.active) return prev;

                    let startMin = prev.startMin;
                    let endMin = prev.endMin;

                    // click kecil -> default duration
                    if (Math.abs(endMin - startMin) < snapMinutes * 2) {
                        startMin = selectStartRef.current;
                        endMin = startMin + defaultDurationMinutes;
                    }

                    startMin = clamp(startMin, startHour * 60, endHour * 60);
                    endMin = clamp(endMin, startHour * 60, endHour * 60);
                    if (endMin <= startMin) endMin = clamp(startMin + defaultDurationMinutes, startHour * 60, endHour * 60);

                    onCreateRange(isoFromLocalMinutes(day, startMin), isoFromLocalMinutes(day, endMin));
                    return { active: false, startMin: 0, endMin: 0 };
                });

                return;
            }

            if (mode === "drag") {
                modeRef.current = "none";

                const dr = dragRef.current;
                dragRef.current = null;
                setDragPreview(null);

                if (!dr) return;

                if (!dr.moved) {
                    onClickEvent(dr.ev);
                    return;
                }

                const startISO = isoFromLocalMinutes(day, dr.curStartMin);
                const endISO = isoFromLocalMinutes(day, dr.curStartMin + dr.durationMin);
                onMoveEvent(dr.ev.eventId, startISO, endISO);
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day, startHour, endHour, snapMinutes, defaultDurationMinutes]);

    return (
        <div className="border border-line rounded-lg overflow-hidden bg-main flex flex-col min-h-0">
            {/* Header */}
            <div className="px-3 py-2 border-b border-line text-[11px] text-slate-300">
                {day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>

            {/* All-day lane */}
            <div className="grid grid-cols-[72px,1fr] border-b border-line">
                <div className="px-2 py-2 text-[11px] text-slate-500">All-day</div>
                <div className="px-2 py-2 flex gap-2 overflow-x-auto savings-scroll">
                    {allDayEvents.length === 0 ? (
                        <span className="text-[11px] text-slate-600">-</span>
                    ) : (
                        allDayEvents.map((ev) => (
                            <button
                                key={ev.instanceId}
                                data-event="1"
                                onClick={() => onClickEvent(ev)}
                                className="px-2 py-1 rounded-md text-[11px] border border-line hover:border-slate-600 truncate min-w-[140px]"
                                style={{ backgroundColor: ev.color ?? "#3b82f6" }}
                                title={ev.title}
                            >
                                {ev.title}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Scroll container (wheel locked) */}
            <div ref={scrollRef} className="flex-1 overflow-auto savings-scroll">
                <div className="grid grid-cols-[72px,1fr]">
                    {/* Time column */}
                    <div className="border-r border-line">
                        {HOURS.map((h) => (
                            <div key={h} className="h-[56px] px-2 text-[11px] text-slate-500 flex items-start pt-2">
                                {pad(h)}:00
                            </div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div
                        ref={gridRef}
                        className="relative"
                        style={{ height: gridHeight }}
                        onMouseDown={beginSelect}
                    >
                        {/* hour lines */}
                        {HOURS.map((h) => (
                            <div
                                key={h}
                                className="absolute left-0 right-0 border-t border-line"
                                style={{ top: (h - startHour) * HOUR_HEIGHT }}
                            />
                        ))}

                        {/* selection overlay */}
                        {selection.active && (
                            <div
                                className="absolute rounded-md border border-blue-400/60 bg-blue-500/10"
                                style={{
                                    left: 6,
                                    right: 6,
                                    top: topFromMinutes(selection.startMin),
                                    height: heightFromMinutes(selection.startMin, selection.endMin),
                                }}
                            />
                        )}

                        {/* drag preview overlay */}
                        {dragPreview?.active && (
                            <div
                                className="absolute rounded-md border border-blue-400/60 bg-blue-500/15 pointer-events-none"
                                style={{
                                    left: 6,
                                    right: 6,
                                    top: topFromMinutes(dragPreview.startMin),
                                    height: heightFromMinutes(dragPreview.startMin, dragPreview.endMin),
                                    zIndex: 50,
                                }}
                            />
                        )}

                        {/* events (with overlap columns) */}
                        {layout.map((it) => {
                            const colW = 100 / it.cols;
                            const left = `calc(${it.col * colW}% + 4px)`;
                            const width = `calc(${colW}% - 8px)`;

                            const isDraggingThis =
                                dragRef.current?.ev.instanceId === it.ev.instanceId;

                            return (
                                <button
                                    key={it.ev.instanceId}
                                    data-event="1"
                                    className="absolute px-2 py-1 rounded-md text-[11px] text-left border border-transparent hover:border-slate-800/60 overflow-hidden"
                                    style={{
                                        left,
                                        width,
                                        top: topFromMinutes(it.startMin),
                                        height: heightFromMinutes(it.startMin, it.endMin),
                                        backgroundColor: it.ev.color ?? "#3b82f6",
                                        opacity: isDraggingThis ? 0.35 : 1,
                                        zIndex: 20 + it.col,
                                    }}
                                    title={it.ev.title}
                                    onMouseDown={(e) => beginDrag(it, e)}
                                >
                                    <div className="font-semibold truncate">{it.ev.title}</div>
                                    <div className="opacity-80 truncate">
                                        {new Date(it.ev.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                                        {new Date(it.ev.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}