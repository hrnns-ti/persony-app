interface StatsCardProps {
    label: string;
    value: string | number;
    change?: string;
    icon?: string;
}

export default function StatsCard({ label, value, change, icon = '{$}' }: StatsCardProps) {
    const isPositive = change?.startsWith('+');

    return (
        <div className="bg-main border border-line rounded-lg my-4 p-6 hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-slate-400">{label}</p>
                <span className="text-sm">{icon}</span>
            </div>

            <p className="text-3xl font-bold text-white mb-2 py-2">{value}</p>

            {change && (
                <p className={`text-xs font-semibold ${isPositive ? 'text-green' : 'text-red'}`}>
                    {change} since last month
                </p>
            )}
        </div>
    );
}
