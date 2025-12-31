interface StatsCardProps {
    label: string;
    value: string | number;
    change?: string;
    icon?: string;
}

export default function StatsCard({ label, value, change, icon = '📊' }: StatsCardProps) {
    const isPositive = change?.startsWith('+');

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-slate-400">{label}</p>
                <span className="text-2xl">{icon}</span>
            </div>

            <p className="text-3xl font-bold text-white mb-2">{value}</p>

            {change && (
                <p className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change} since last month
                </p>
            )}
        </div>
    );
}
