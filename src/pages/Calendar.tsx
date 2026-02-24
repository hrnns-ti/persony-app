import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent, CalendarView, EventCreateInput } from "../types/calendar";
import { useCalendars } from "../hooks/calendar/useCalendar";
import { useEventInstances } from "../hooks/calendar/useEventInstances";
import CalendarToolbar from "../components/calendar/CalendarToolbar";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import DayView from "../components/calendar/DayView";
import AgendaView from "../components/calendar/AgendaView";
import YearView from "../components/calendar/YearView";
import EventForm from "../components/calendar/EventForm";
import EventDetail from "../components/calendar/EventDetail";
import Modal from "../components/ui/Modal";

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function startOfWeek(date: Date, weekStartsOnMonday = true) {
    const d = startOfDay(date);
    const day = d.getDay(); // 0 Sun..6 Sat
    const weekStart = weekStartsOnMonday ? 1 : 0;
    const diff = (day - weekStart + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
}

function startOfMonthGrid(date: Date, weekStartsOnMonday = true) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = first.getDay();
    const weekStart = weekStartsOnMonday ? 1 : 0;
    const diff = (day - weekStart + 7) % 7;
    first.setDate(first.getDate() - diff);
    first.setHours(0, 0, 0, 0);
    return first;
}

function monthLabel(d: Date) {
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function weekLabel(start: Date) {
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    const startFmt = start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
    });

    const endFmt = end.toLocaleDateString(undefined, {
        month: sameMonth ? undefined : "short",
        day: "numeric",
        year: "numeric",
    });

    // contoh: Mar 30 – Apr 5, 2026
    return `${startFmt} – ${endFmt}`;
}

function dayLabel(d: Date) {
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function CalendarPage() {
    const {
        calendars,
        visibleCalendarIds,
        visibleSet,
        loading: calLoading,
        error: calError,
        toggleCalendarVisibility,
        showAll,
        hideAll,
    } = useCalendars();

    const {
        events,
        instances,
        byDay,
        loading,
        error,
        loadInstancesForRange,
        addEvent,
        updateEvent,
        removeEvent,
    } = useEventInstances();

    const [view, setView] = useState<CalendarView>("month");
    const [activeDate, setActiveDate] = useState(new Date());

    // modal
    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);

    const [defaultStartISO, setDefaultStartISO] = useState<string | undefined>(undefined);
    const [defaultEndISO, setDefaultEndISO] = useState<string | undefined>(undefined);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const selectedEvent = useMemo<CalendarEvent | null>(() => {
        if (!selectedEventId) return null;
        return events.find((e) => e.id === selectedEventId) ?? null;
    }, [events, selectedEventId]);

    // ✅ range bergantung view
    const range = useMemo(() => {
        if (view === "month") {
            const start = startOfMonthGrid(activeDate, true);
            const end = addDays(start, 42); // exclusive
            return { startISO: start.toISOString(), endISO: end.toISOString() };
        }

        if (view === "week") {
            const start = startOfWeek(activeDate, true);
            const end = addDays(start, 7);
            return { startISO: start.toISOString(), endISO: end.toISOString() };
        }

        if (view === "day") {
            const start = startOfDay(activeDate);
            const end = addDays(start, 1);
            return { startISO: start.toISOString(), endISO: end.toISOString() };
        }

        if (view === "year") {
            const start = new Date(activeDate.getFullYear(), 0, 1, 0, 0, 0, 0);
            const end = new Date(activeDate.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
            return { startISO: start.toISOString(), endISO: end.toISOString() };
        }

        // agenda: 30 hari dari activeDate
        const start = startOfDay(activeDate);
        const end = addDays(start, 30);
        return { startISO: start.toISOString(), endISO: end.toISOString() };
    }, [activeDate, view]);

    // ✅ label toolbar bergantung view
    const toolbarLabel = useMemo(() => {
        if (view === "month") return monthLabel(activeDate);
        if (view === "week") return weekLabel(startOfWeek(activeDate, true));
        if (view === "day") return dayLabel(activeDate);
        if (view === "year") return String(activeDate.getFullYear());
        return `Agenda • ${dayLabel(activeDate)}`;
    }, [activeDate, view]);

    useEffect(() => {
        void loadInstancesForRange(range.startISO, range.endISO, visibleCalendarIds);
    }, [loadInstancesForRange, range.startISO, range.endISO, visibleCalendarIds]);

    function goToday() {
        setActiveDate(new Date());
    }

    // ✅ FIX klik 2x: gunakan functional update + setDate(1) sebelum setMonth
    function prev() {
        setActiveDate((prevDate) => {
            const d = new Date(prevDate);

            if (view === "month") {
                d.setDate(1);
                d.setMonth(d.getMonth() - 1);
                return d;
            }
            if (view === "year") {
                d.setMonth(0, 1);
                d.setFullYear(d.getFullYear() - 1);
                return d;
            }
            if (view === "week") {
                d.setDate(d.getDate() - 7);
                return d;
            }
            if (view === "day") {
                d.setDate(d.getDate() - 1);
                return d;
            }
            // agenda
            d.setDate(d.getDate() - 7);
            return d;
        });
    }

    function next() {
        setActiveDate((prevDate) => {
            const d = new Date(prevDate);

            if (view === "month") {
                d.setDate(1);
                d.setMonth(d.getMonth() + 1);
                return d;
            }
            if (view === "year") {
                d.setMonth(0, 1);
                d.setFullYear(d.getFullYear() + 1);
                return d;
            }
            if (view === "week") {
                d.setDate(d.getDate() + 7);
                return d;
            }
            if (view === "day") {
                d.setDate(d.getDate() + 1);
                return d;
            }
            // agenda
            d.setDate(d.getDate() + 7);
            return d;
        });
    }

    function openCreateAtDay(day: Date) {
        const start = new Date(day);
        start.setHours(9, 0, 0, 0);
        const end = new Date(day);
        end.setHours(10, 0, 0, 0);

        setDefaultStartISO(start.toISOString());
        setDefaultEndISO(end.toISOString());
        setCreateOpen(true);
    }

    const weekStart = useMemo(() => startOfWeek(activeDate, true), [activeDate]);

    return (
        <main className="mt-3 flex-1 bg-main overflow-hidden flex flex-col">
            <div className="flex-1 p-8 overflow-hidden">
                <div className="grid grid-cols-[260px,1fr] gap-4 h-full min-h-0">
                    {/* Sidebar */}
                    <aside className="border border-line rounded-lg bg-main p-4 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-slate-300">Calendars</h2>
                            <div className="flex gap-2">
                                <button onClick={showAll} className="text-[11px] text-slate-400 hover:text-slate-200">
                                    Show all
                                </button>
                                <button onClick={hideAll} className="text-[11px] text-slate-400 hover:text-slate-200">
                                    Hide all
                                </button>
                            </div>
                        </div>

                        {calError && <p className="text-xs text-red-400 mb-2">{calError}</p>}

                        <div className="flex-1 overflow-y-auto savings-scroll space-y-2 pr-1">
                            {calLoading && <p className="text-xs text-slate-500">Loading...</p>}

                            {!calLoading &&
                                calendars.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleCalendarVisibility(c.id)}
                                        className="w-full flex items-center justify-between gap-2 border border-line rounded-md px-3 py-2 hover:border-slate-600"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                      <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color ?? "#3b82f6" }}
                      />
                                            <span className="text-xs text-slate-200 truncate">{c.title}</span>
                                            {c.isPrimary && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-line text-slate-400">
                          primary
                        </span>
                                            )}
                                        </div>

                                        <span className="text-[11px] text-slate-400">
                      {visibleSet.has(c.id) ? "On" : "Off"}
                    </span>
                                    </button>
                                ))}
                        </div>

                        <div className="pt-3 border-t border-line mt-3">
                            <p className="text-[11px] text-slate-500">
                                MVP: Multi view (day/week/month/year/agenda). Recurring next.
                            </p>
                        </div>
                    </aside>

                    {/* Main */}
                    <section className="flex flex-col gap-4 min-h-0">
                        <CalendarToolbar
                            view={view}
                            onChangeView={setView}
                            label={toolbarLabel}
                            onPrev={prev}
                            onNext={next}
                            onToday={goToday}
                            onCreate={() => openCreateAtDay(new Date(activeDate))}
                        />

                        {error && <p className="text-xs text-red-400">{error}</p>}

                        <div className="flex-1 min-h-0">
                            {view === "month" && (
                                <MonthView
                                    activeDate={activeDate}
                                    byDay={byDay}
                                    onClickDay={(d) => openCreateAtDay(d)}
                                    onClickEvent={(instance) => {
                                        setSelectedEventId(instance.eventId);
                                        setDetailOpen(true);
                                    }}
                                />
                            )}

                            <WeekView
                                weekStart={weekStart}
                                instances={instances}
                                startHour={0}
                                endHour={24}
                                onClickEvent={(ev) => {
                                    setSelectedEventId(ev.eventId);
                                    setDetailOpen(true);
                                }}
                                onCreateRange={(startISO, endISO) => {
                                    setDefaultStartISO(startISO);
                                    setDefaultEndISO(endISO);
                                    setCreateOpen(true);
                                }}
                                onMoveEvent={async (eventId, startISO, endISO) => {
                                    await updateEvent(eventId, { start: startISO, end: endISO } as any);
                                    await loadInstancesForRange(range.startISO, range.endISO, visibleCalendarIds);
                                }}
                            />

                            <DayView
                                day={activeDate}
                                instances={instances}
                                startHour={0}
                                endHour={24}
                                onClickEvent={(ev) => {
                                    setSelectedEventId(ev.eventId);
                                    setDetailOpen(true);
                                }}
                                onCreateRange={(startISO, endISO) => {
                                    setDefaultStartISO(startISO);
                                    setDefaultEndISO(endISO);
                                    setCreateOpen(true);
                                }}
                                onMoveEvent={async (eventId, startISO, endISO) => {
                                    await updateEvent(eventId, { start: startISO, end: endISO } as any);
                                    await loadInstancesForRange(range.startISO, range.endISO, visibleCalendarIds);
                                }}
                            />

                            {view === "agenda" && (
                                <AgendaView
                                    instances={instances}
                                    onClickEvent={(ev) => {
                                        setSelectedEventId(ev.eventId);
                                        setDetailOpen(true);
                                    }}
                                />
                            )}

                            {view === "year" && (
                                <YearView
                                    year={activeDate.getFullYear()}
                                    onPickMonth={(m) => {
                                        setView("month");
                                        setActiveDate(new Date(activeDate.getFullYear(), m, 1));
                                    }}
                                />
                            )}
                        </div>

                        {loading && <p className="text-xs text-slate-500">Loading events...</p>}
                    </section>
                </div>
            </div>

            {/* Create Modal */}
            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create event">
                <EventForm
                    calendars={calendars}
                    defaultCalendarId={calendars.find((c) => c.isPrimary)?.id ?? calendars[0]?.id}
                    defaultStartISO={defaultStartISO}
                    defaultEndISO={defaultEndISO}
                    onCancel={() => setCreateOpen(false)}
                    onSubmit={async (data) => {
                        await addEvent(data as EventCreateInput);
                        setCreateOpen(false);
                        await loadInstancesForRange(range.startISO, range.endISO, visibleCalendarIds);
                    }}
                />
            </Modal>

            {/* Detail Modal */}
            {selectedEvent && (
                <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={selectedEvent.title}>
                    <EventDetail
                        calendars={calendars}
                        event={selectedEvent}
                        onClose={() => setDetailOpen(false)}
                        onUpdate={async (id, patch) => {
                            await updateEvent(id, patch as any);
                            await loadInstancesForRange(range.startISO, range.endISO, visibleCalendarIds);
                        }}
                        onDelete={async (id) => {
                            await removeEvent(id);
                            await loadInstancesForRange(range.startISO, range.endISO, visibleCalendarIds);
                            setDetailOpen(false);
                        }}
                    />
                </Modal>
            )}
        </main>
    );
}