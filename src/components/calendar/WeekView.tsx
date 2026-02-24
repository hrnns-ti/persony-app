import { useEffect, useMemo, useRef, useState } from "react";
import type { EventInstance } from "../../types/calendar";

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
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

export default function WeekView(props: {
    weekStart: Date;
    instances: EventInstance[];

    onClickEvent: (ev: EventInstance) => void;
    onCreateRange: (startISO: string, endISO: string) => void;
    onMoveEvent: (eventId: string, startISO: string, endISO: string) => void;

    startHour?: number;
    endHour?: number;
    snapMinutes?: number;
    defaultDurationMinutes?: number;
}) {
    const {
        weekStart,
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

    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    // ✅ wheel lock: scroll di grid, bukan scroll page
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel as any);
    }, []);

    // refs per day column untuk drag day detection
    const colRefs = useRef<(HTMLDivElement | null)[]>([]);

    const allDayByDay = useMemo(() => {
        const map = new Map<number, EventInstance[]>();
        for (let i = 0; i < 7; i++) map.set(i, []);
        for (const ev of instances) {
            if (!ev.allDay) continue;
            const d = new Date(ev.start);
            const idx = Math.floor(
                (startOfDay(d).getTime() - startOfDay(weekStart).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (idx >= 0 && idx < 7) map.get(idx)!.push(ev);
        }
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
            map.set(k, arr);
        }
        return map;
    }, [instances, weekStart]);

    const timedLayoutByDay = useMemo(() => {
        const baseWeek = startOfDay(weekStart).getTime();
        const minBound = startHour * 60;
        const maxBound = endHour * 60;

        const map = new Map<number, LayoutItem[]>();
        for (let i = 0; i < 7; i++) map.set(i, []);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayBase = baseWeek + dayIndex * 24 * 60 * 60 * 1000;

            const raw = instances
                .filter((x) => !x.allDay)
                .filter((x) => {
                    const t = new Date(x.start).getTime();
                    const dIdx = Math.floor((startOfDay(new Date(t)).getTime() - baseWeek) / (1000 * 60 * 60 * 24));
                    return dIdx === dayIndex;
                })
                .map((ev) => {
                    const s = Math.floor((new Date(ev.start).getTime() - dayBase) / 60000);
                    const e = Math.floor((new Date(ev.end).getTime() - dayBase) / 60000);
                    const startMin = clamp(s, minBound, maxBound);
                    const endMin = clamp(e, minBound, maxBound);
                    return { ev, startMin, endMin };
                })
                .filter((x) => x.endMin > x.startMin);

            map.set(dayIndex, buildLayout(raw));
        }

        return map;
    }, [instances, weekStart, startHour, endHour]);

    function dayHeaderLabel(d: Date) {
        return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
    }

    function minutesFromPointer(dayIndex: number, e: MouseEvent | React.MouseEvent) {
        const el = colRefs.current[dayIndex];
        if (!el) return startHour * 60;

        const rect = el.getBoundingClientRect();
        const y = (e as MouseEvent).clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
        const rawMinutes = startHour * 60 + (y / HOUR_HEIGHT) * 60;
        const snapped = Math.round(rawMinutes / snapMinutes) * snapMinutes;

        return clamp(snapped, startHour * 60, endHour * 60);
    }

    function dayIndexFromPointerX(x: number) {
        for (let i = 0; i < 7; i++) {
            const el = colRefs.current[i];
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (x >= r.left && x <= r.right) return i;
        }
        return 0;
    }

    function topFromMinutes(min: number) {
        return ((min - startHour * 60) / 60) * HOUR_HEIGHT;
    }
    function heightFromMinutes(a: number, b: number) {
        return Math.max(18, ((b - a) / 60) * HOUR_HEIGHT);
    }

    // ===== selection(create) + drag(move) =====
    const modeRef = useRef<"none" | "select" | "drag">("none");
    const selectStartRef = useRef(0);
    const selectDayRef = useRef(0);

    const [selection, setSelection] = useState<{ active: boolean; dayIndex: number; startMin: number; endMin: number }>({
        active: false,
        dayIndex: 0,
        startMin: 0,
        endMin: 0,
    });

    const dragRef = useRef<{
        ev: EventInstance;
        durationMin: number;
        pointerOffsetMin: number;
        originalDay: number;
        originalStartMin: number;
        moved: boolean;
        curDay: number;
        curStartMin: number;
    } | null>(null);

    const [dragPreview, setDragPreview] = useState<{ active: boolean; dayIndex: number; startMin: number; endMin: number } | null>(null);

    function beginSelect(dayIndex: number, e: React.MouseEvent) {
        if ((e.target as HTMLElement).closest("[data-event='1']")) return;

        e.preventDefault();
        modeRef.current = "select";

        const m = minutesFromPointer(dayIndex, e);
        selectStartRef.current = m;
        selectDayRef.current = dayIndex;

        setSelection({ active: true, dayIndex, startMin: m, endMin: m + snapMinutes });
    }

    function beginDrag(item: LayoutItem, dayIndex: number, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        modeRef.current = "drag";

        const pointerMin = minutesFromPointer(dayIndex, e);
        const pointerOffsetMin = pointerMin - item.startMin;
        const durationMin = item.endMin - item.startMin;

        dragRef.current = {
            ev: item.ev,
            durationMin,
            pointerOffsetMin,
            originalDay: dayIndex,
            originalStartMin: item.startMin,
            moved: false,
            curDay: dayIndex,
            curStartMin: item.startMin,
        };

        setDragPreview({ active: true, dayIndex, startMin: item.startMin, endMin: item.endMin });
    }

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const mode = modeRef.current;
            if (mode === "none") return;

            if (mode === "select") {
                const dayIndex = selectDayRef.current;
                const cur = minutesFromPointer(dayIndex, e);
                const start = selectStartRef.current;

                const a = Math.min(start, cur);
                const b = Math.max(start, cur);
                setSelection({ active: true, dayIndex, startMin: a, endMin: b });
                return;
            }

            if (mode === "drag") {
                const dr = dragRef.current;
                if (!dr) return;

                const dayIndex = dayIndexFromPointerX(e.clientX);
                const pointerMin = minutesFromPointer(dayIndex, e);

                let newStart = pointerMin - dr.pointerOffsetMin;
                newStart = Math.round(newStart / snapMinutes) * snapMinutes;
                newStart = clamp(newStart, startHour * 60, endHour * 60 - dr.durationMin);

                dr.curDay = dayIndex;
                dr.curStartMin = newStart;
                dr.moved =
                    dr.moved ||
                    dayIndex !== dr.originalDay ||
                    Math.abs(newStart - dr.originalStartMin) >= snapMinutes;

                setDragPreview({
                    active: true,
                    dayIndex,
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

                    if (Math.abs(endMin - startMin) < snapMinutes * 2) {
                        startMin = selectStartRef.current;
                        endMin = startMin + defaultDurationMinutes;
                    }

                    startMin = clamp(startMin, startHour * 60, endHour * 60);
                    endMin = clamp(endMin, startHour * 60, endHour * 60);
                    if (endMin <= startMin) endMin = clamp(startMin + defaultDurationMinutes, startHour * 60, endHour * 60);

                    const day = days[prev.dayIndex];
                    onCreateRange(isoFromLocalMinutes(day, startMin), isoFromLocalMinutes(day, endMin));
                    return { active: false, dayIndex: 0, startMin: 0, endMin: 0 };
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

                const day = days[dr.curDay];
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
    }, [days, startHour, endHour, snapMinutes, defaultDurationMinutes]);

    return (
        <div className="border border-line rounded-lg overflow-hidden bg-main flex flex-col min-h-0">
            {/* Header row */}
            <div className="grid grid-cols-[72px,repeat(7,1fr)] border-b border-line">
                <div className="px-2 py-2 text-[11px] text-slate-500">GMT+7</div>
                {days.map((d) => (
                    <div key={d.toISOString()} className="px-3 py-2 text-[11px] text-slate-300">
                        {dayHeaderLabel(d)}
                    </div>
                ))}
            </div>

            {/* All-day row */}
            <div className="grid grid-cols-[72px,repeat(7,1fr)] border-b border-line">
                <div className="px-2 py-2 text-[11px] text-slate-500">All-day</div>
                {days.map((d, idx) => (
                    <div key={d.toISOString()} className="px-2 py-2 flex gap-2 overflow-x-auto savings-scroll">
                        {(allDayByDay.get(idx) ?? []).slice(0, 3).map((ev) => (
                            <button
                                key={ev.instanceId}
                                data-event="1"
                                onClick={() => onClickEvent(ev)}
                                className="px-2 py-1 rounded-md text-[11px] border border-line hover:border-slate-600 truncate min-w-[120px]"
                                style={{ backgroundColor: ev.color ?? "#3b82f6" }}
                                title={ev.title}
                            >
                                {ev.title}
                            </button>
                        ))}
                        {(allDayByDay.get(idx)?.length ?? 0) > 3 && (
                            <span className="text-[11px] text-slate-500">+{(allDayByDay.get(idx)?.length ?? 0) - 3}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Scroll container (wheel locked) */}
            <div ref={scrollRef} className="flex-1 overflow-auto savings-scroll">
                <div className="grid grid-cols-[72px,repeat(7,1fr)]">
                    {/* Time column */}
                    <div className="border-r border-line">
                        {HOURS.map((h) => (
                            <div key={h} className="h-[56px] px-2 text-[11px] text-slate-500 flex items-start pt-2">
                                {pad(h)}:00
                            </div>
                        ))}
                    </div>

                    {/* 7 day columns */}
                    {days.map((d, dayIndex) => {
                        const list = timedLayoutByDay.get(dayIndex) ?? [];

                        return (
                            <div
                                key={d.toISOString()}
                                // @ts-ignore
                                ref={(el) => (colRefs.current[dayIndex] = el)}
                                className="relative border-r border-line"
                                style={{ height: gridHeight }}
                                onMouseDown={(e) => beginSelect(dayIndex, e)}
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
                                {selection.active && selection.dayIndex === dayIndex && (
                                    <div
                                        className="absolute rounded-md border border-blue-400/60 bg-blue-500/10"
                                        style={{
                                            left: 6,
                                            right: 6,
                                            top: ((selection.startMin - startHour * 60) / 60) * HOUR_HEIGHT,
                                            height: Math.max(18, ((selection.endMin - selection.startMin) / 60) * HOUR_HEIGHT),
                                        }}
                                    />
                                )}

                                {/* drag preview */}
                                {dragPreview?.active && dragPreview.dayIndex === dayIndex && (
                                    <div
                                        className="absolute rounded-md border border-blue-400/60 bg-blue-500/15 pointer-events-none"
                                        style={{
                                            left: 6,
                                            right: 6,
                                            top: ((dragPreview.startMin - startHour * 60) / 60) * HOUR_HEIGHT,
                                            height: Math.max(18, ((dragPreview.endMin - dragPreview.startMin) / 60) * HOUR_HEIGHT),
                                            zIndex: 60,
                                        }}
                                    />
                                )}

                                {/* events */}
                                {list.map((it) => {
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
                                            onMouseDown={(e) => beginDrag(it, dayIndex, e)}
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
                        );
                    })}
                </div>
            </div>
        </div>
    );
}