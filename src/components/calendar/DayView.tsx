import React, {useEffect, useMemo, useRef, useState} from "react";
import type {EventInstance} from "../../types/calendar";

const CAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";

function zonedParts(date: Date, timeZone = CAL_TZ) {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).formatToParts(date);

        const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";

        return {
            year: Number(get("year")),
            month: Number(get("month")),
            day: Number(get("day")),
            hour: Number(get("hour")),
            minute: Number(get("minute")),
            second: Number(get("second")),
        };
    } catch {
        // fallback (kalau Intl timeZone tidak support)
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
        };
    }
}

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

export default function DayView(props: {
    day: Date;
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

    // DEBUG
    const DEBUG_NOW = false;

    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
        return () => window.clearInterval(id);
    }, []);

    const nowP = zonedParts(new Date());
    const dayP = zonedParts(day);

    const isToday = dayP.year === nowP.year && dayP.month === nowP.month && dayP.day === nowP.day;
    const nowMinutes = nowP.hour * 60 + nowP.minute + nowP.second / 60;
    const showNow = isToday && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
    const nowTopPx = ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT;

    const didAutoScroll = useRef(false);
    useEffect(() => {
        if (!showNow) {
            didAutoScroll.current = false;
            return;
        }
        const el = scrollRef.current;
        if (!el) return;
        if (didAutoScroll.current) return;

        el.scrollTop = clamp(nowTopPx - el.clientHeight * 0.35, 0, gridHeight - el.clientHeight);
        didAutoScroll.current = true;
    }, [showNow, nowTopPx, gridHeight, tick]);

    // wheel lock
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

    const allDayEvents = useMemo(() => {
        return instances
            .filter((x) => x.allDay)
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [instances]);

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

    // ===== selection(create) + drag(move) =====
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
                setSelection({ active: true, startMin: Math.min(start, cur), endMin: Math.max(start, cur) });
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

                setDragPreview({ active: true, startMin: newStart, endMin: newStart + dr.durationMin });
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
    }, [day, startHour, endHour, snapMinutes, defaultDurationMinutes]);

    return (
        <div className="border border-line rounded-lg overflow-hidden bg-main flex flex-col min-h-0 h-full">
            <div className="px-3 py-2 border-b border-line text-[11px] text-slate-300">
                {day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>

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

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto savings-scroll">
                <div className="grid grid-cols-[72px,1fr]">
                    <div className="border-r border-line">
                        {HOURS.map((h) => (
                            <div key={h} className="h-[56px] px-2 text-[11px] text-slate-500 flex items-start pt-2">
                                {pad(h)}:00
                            </div>
                        ))}
                    </div>

                    <div ref={gridRef} className="relative" style={{ height: gridHeight }} onMouseDown={beginSelect}>
                        {DEBUG_NOW && (
                            <div className="absolute left-2 top-2 z-[9999] text-[10px] text-red-400">
                                isToday={String(isToday)} showNow={String(showNow)} now={nowP.hour}:{String(nowP.minute).padStart(2, "0")}
                            </div>
                        )}

                        {showNow && (
                            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: nowTopPx, zIndex: 40 }}>
                                <div className="absolute -left-2 -top-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                                <div className="h-[2px] w-full" style={{ backgroundColor: "#ef4444" }} />
                            </div>
                        )}

                        {HOURS.map((h) => (
                            <div
                                key={h}
                                className="absolute left-0 right-0 border-t border-line"
                                style={{ top: (h - startHour) * HOUR_HEIGHT }}
                            />
                        ))}

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

                        {dragPreview?.active && (
                            <div
                                className="absolute rounded-md border border-blue-400/60 bg-blue-500/15 pointer-events-none"
                                style={{
                                    left: 6,
                                    right: 6,
                                    top: topFromMinutes(dragPreview.startMin),
                                    height: heightFromMinutes(dragPreview.startMin, dragPreview.endMin),
                                    zIndex: 60,
                                }}
                            />
                        )}

                        {layout.map((it) => {
                            const colW = 100 / it.cols;
                            const left = `calc(${it.col * colW}% + 4px)`;
                            const width = `calc(${colW}% - 8px)`;
                            const isDraggingThis = dragRef.current?.ev.instanceId === it.ev.instanceId;

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