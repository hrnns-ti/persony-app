import type { CalendarView } from "../../types/calendar";

export default function CalendarToolbar(props: {
    view: CalendarView;
    onChangeView: (v: CalendarView) => void;

    label: string;

    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onCreate: () => void;
}) {
    const { view, onChangeView, label, onPrev, onNext, onToday, onCreate } = props;

    return (
        <div className="flex items-center justify-between gap-3 border border-line rounded-lg p-3 bg-main">
            <div className="flex items-center gap-2">
                <button
                    onClick={onCreate}
                    className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500"
                >
                    + Create
                </button>

                <button
                    onClick={onToday}
                    className="px-3 py-2 rounded-md border border-line text-slate-200 text-xs hover:border-slate-600"
                >
                    Hari ini
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onPrev}
                        className="h-9 w-9 rounded-md border border-line text-slate-200 hover:border-slate-600"
                        aria-label="Prev"
                    >
                        ‹
                    </button>
                    <button
                        onClick={onNext}
                        className="h-9 w-9 rounded-md border border-line text-slate-200 hover:border-slate-600"
                        aria-label="Next"
                    >
                        ›
                    </button>
                </div>

                <h2 className="ml-2 text-sm font-semibold text-slate-200">{label}</h2>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={view}
                    onChange={(e) => onChangeView(e.target.value as CalendarView)}
                    className="bg-secondary border border-line rounded-md px-2 py-2 text-xs text-slate-200"
                >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                    <option value="agenda">Agenda</option>
                </select>
            </div>
        </div>
    );
}