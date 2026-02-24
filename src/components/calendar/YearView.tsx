export default function YearView(props: {
    year: number;
    onPickMonth: (monthIndex0: number) => void; // 0..11
}) {
    const { year, onPickMonth } = props;

    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    return (
        <div className="border border-line rounded-lg bg-main overflow-auto savings-scroll p-4">
            <div className="grid grid-cols-3 gap-4">
                {months.map((m) => (
                    <button
                        key={m.toISOString()}
                        onClick={() => onPickMonth(m.getMonth())}
                        className="border border-line rounded-lg p-3 hover:border-slate-600 text-left"
                    >
                        <div className="text-sm font-semibold text-slate-200">
                            {m.toLocaleDateString(undefined, { month: "long" })}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Open month</div>
                    </button>
                ))}
            </div>
        </div>
    );
}