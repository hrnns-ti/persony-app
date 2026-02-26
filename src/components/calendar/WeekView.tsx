import React, {useEffect, useMemo, useRef, useState} from "react";
import type {EventInstance} from "../../types/calendar";

// timezone otomatis (fallback Asia/Jakarta)
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

function fmtTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type StackItem = {
    ev: EventInstance;
    startMin: number;
    endMin: number;
    stackIndex: number;
    stackCount: number;
};

// overlap -> stack overlay (bukan split kolom)
function buildStackLayout(items: Array<{ ev: EventInstance; startMin: number; endMin: number }>): StackItem[] {
    const sorted = [...items].sort((a, b) => {
        if (a.startMin !== b.startMin) return a.startMin - b.startMin;
        const da = a.endMin - a.startMin;
        const db = b.endMin - b.startMin;
        return db - da; // longer first
    });

    const result: StackItem[] = [];

    let cluster: typeof sorted = [];
    let clusterEnd = -Infinity;

    const flush = () => {
        if (!cluster.length) return;

        const ordered = [...cluster].sort((a, b) => {
            if (a.startMin !== b.startMin) return a.startMin - b.startMin;
            const da = a.endMin - a.startMin;
            const db = b.endMin - b.startMin;
            return db - da;
        });

        ordered.forEach((it, idx) => {
            result.push({
                ev: it.ev,
                startMin: it.startMin,
                endMin: it.endMin,
                stackIndex: idx,
                stackCount: ordered.length,
            });
        });

        cluster = [];
        clusterEnd = -Infinity;
    };

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
            flush();
            cluster = [it];
            clusterEnd = it.endMin;
        }
    }
    flush();

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
    const colRefs = useRef<(HTMLDivElement | null)[]>([]);

    // ===== dedupe (hindari "double event" kalau data dobel) =====
    const uniqInstances = useMemo(() => {
        const seen = new Set<string>();
        const out: EventInstance[] = [];
        for (const it of instances) {
            const k = (it as any).instanceId ?? `${it.eventId}|${it.start}|${it.end}`;
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(it);
        }
        return out;
    }, [instances]);

    // ===== NOW INDICATOR (timezone-safe) =====
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
        return () => window.clearInterval(id);
    }, []);

    const nowP = zonedParts(new Date());
    const nowMinutes = nowP.hour * 60 + nowP.minute + nowP.second / 60;
    const nowTopPx = ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT;

    const todayIndex = useMemo(() => {
        return days.findIndex((d) => {
            const p = zonedParts(d);
            return p.year === nowP.year && p.month === nowP.month && p.day === nowP.day;
        });
    }, [days, nowP.year, nowP.month, nowP.day]);

    const showNow = todayIndex >= 0 && todayIndex < 7 && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

    // auto-scroll sekali ke posisi now (kalau today ada dalam minggu ini)
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

    // ===== data all-day =====
    const allDayByDay = useMemo(() => {
        const map = new Map<number, EventInstance[]>();
        for (let i = 0; i < 7; i++) map.set(i, []);

        for (const ev of uniqInstances) {
            if (!ev.allDay) continue;
            const d = new Date(ev.start);
            const idx = Math.floor((startOfDay(d).getTime() - startOfDay(weekStart).getTime()) / 86400000);
            if (idx >= 0 && idx < 7) map.get(idx)!.push(ev);
        }

        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
            map.set(k, arr);
        }
        return map;
    }, [uniqInstances, weekStart]);

    // ===== timed layout per day (stack) =====
    const stackedLayoutByDay = useMemo(() => {
        const baseWeek = startOfDay(weekStart).getTime();
        const minBound = startHour * 60;
        const maxBound = endHour * 60;

        const map = new Map<number, StackItem[]>();
        for (let i = 0; i < 7; i++) map.set(i, []);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayBase = baseWeek + dayIndex * 86400000;

            const raw = uniqInstances
                .filter((x) => !x.allDay)
                .filter((x) => {
                    const t = new Date(x.start).getTime();
                    const dIdx = Math.floor((startOfDay(new Date(t)).getTime() - baseWeek) / 86400000);
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

            map.set(dayIndex, buildStackLayout(raw));
        }

        return map;
    }, [uniqInstances, weekStart, startHour, endHour]);

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

    function beginDrag(it: StackItem, dayIndex: number, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        modeRef.current = "drag";

        const pointerMin = minutesFromPointer(dayIndex, e);
        const pointerOffsetMin = pointerMin - it.startMin;
        const durationMin = it.endMin - it.startMin;

        dragRef.current = {
            ev: it.ev,
            durationMin,
            pointerOffsetMin,
            originalDay: dayIndex,
            originalStartMin: it.startMin,
            moved: false,
            curDay: dayIndex,
            curStartMin: it.startMin,
        };

        setDragPreview({ active: true, dayIndex, startMin: it.startMin, endMin: it.endMin });
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
                dr.moved = dr.moved || dayIndex !== dr.originalDay || Math.abs(newStart - dr.originalStartMin) >= snapMinutes;

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

                    const d = days[prev.dayIndex];
                    onCreateRange(isoFromLocalMinutes(d, startMin), isoFromLocalMinutes(d, endMin));
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

                const d = days[dr.curDay];
                const startISO = isoFromLocalMinutes(d, dr.curStartMin);
                const endISO = isoFromLocalMinutes(d, dr.curStartMin + dr.durationMin);
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
        <div className="border border-line rounded-lg overflow-hidden bg-main flex flex-col min-h-0 h-full">
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
                    <div key={d.toISOString()} className="px-2 py-2 flex gap-2 overflow-x-auto hidden-scroll">
                        {(allDayByDay.get(idx) ?? []).slice(0, 3).map((ev) => {
                            const tooltip = [ev.title, ev.location, ev.description].filter(Boolean).join("\n");
                            return (
                                <button
                                    key={(ev as any).instanceId ?? `${ev.eventId}|${ev.start}|${ev.end}`}
                                    data-event="1"
                                    onClick={() => onClickEvent(ev)}
                                    className="px-2 py-1 rounded-md text-[11px] border border-line hover:border-slate-600 truncate min-w-[140px]"
                                    style={{ backgroundColor: ev.color ?? "#3b82f6" }}
                                    title={tooltip}
                                >
                                    <div className="font-semibold truncate">{ev.title}</div>
                                    {ev.location && <div className="opacity-90 text-[10px] truncate">{ev.location}</div>}
                                </button>
                            );
                        })}
                        {(allDayByDay.get(idx)?.length ?? 0) > 3 && (
                            <span className="text-[11px] text-slate-500">+{(allDayByDay.get(idx)?.length ?? 0) - 3}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Scroll */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto savings-scroll">
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
                        const list = stackedLayoutByDay.get(dayIndex) ?? [];

                        return (
                            <div
                                key={d.toISOString()}
                                ref={(el) => {
                                    colRefs.current[dayIndex] = el;
                                }}
                                className="relative border-r border-line"
                                style={{ height: gridHeight }}
                                onMouseDown={(e) => beginSelect(dayIndex, e)}
                            >
                                {showNow && dayIndex === todayIndex && (
                                    <div className="absolute left-0 right-0 pointer-events-none" style={{ top: nowTopPx, zIndex: 40 }}>
                                        <div className="absolute -left-2 -top-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                                        <div className="h-[2px] w-full" style={{ backgroundColor: "#ef4444" }} />
                                    </div>
                                )}

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
                                            zIndex: 35,
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

                                {/* events (stack overlay) */}
                                {list.map((it) => {
                                    const offset = Math.min(it.stackIndex * 10, 24);
                                    const leftPx = 6 + offset;
                                    const width = `calc(100% - ${leftPx + 6}px)`;

                                    const isDraggingThis = dragRef.current?.ev.instanceId === (it.ev as any).instanceId;

                                    const timeText = `${fmtTime(it.ev.start)} – ${fmtTime(it.ev.end)}`;
                                    const tooltip = [it.ev.title, timeText, it.ev.location, it.ev.description].filter(Boolean).join("\n");

                                    return (
                                        <button
                                            key={(it.ev as any).instanceId ?? `${it.ev.eventId}|${it.ev.start}|${it.ev.end}`}
                                            data-event="1"
                                            className="absolute px-2 py-1 rounded-md text-left border border-transparent hover:border-slate-800/60 overflow-hidden"
                                            style={{
                                                left: `${leftPx}px`,
                                                width,
                                                top: topFromMinutes(it.startMin),
                                                height: heightFromMinutes(it.startMin, it.endMin),
                                                backgroundColor: it.ev.color ?? "#3b82f6",
                                                opacity: isDraggingThis ? 0.35 : 1,
                                                zIndex: 20 + it.stackIndex,
                                            }}
                                            title={tooltip}
                                            onMouseDown={(e) => beginDrag(it, dayIndex, e)}
                                        >
                                            {it.stackCount > 1 && it.stackIndex === it.stackCount - 1 && (
                                                <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                                                    +{it.stackCount - 1}
                                                </div>
                                            )}

                                            <div className="text-[11px] font-semibold truncate">{it.ev.title}</div>
                                            <div className="text-[10px] opacity-90 truncate">{timeText}</div>

                                            {it.ev.location && <div className="text-[10px] opacity-85 truncate">{it.ev.location}</div>}

                                            {it.ev.description && (
                                                <div className="text-[10px] opacity-75 leading-tight max-h-[26px] overflow-hidden">
                                                    {it.ev.description}
                                                </div>
                                            )}
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