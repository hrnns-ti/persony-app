import Card from '../ui/Card';
import SpendingPie from './SpendingPie';

export default function ChartSection() {
    return (
        <div className="space-y-6">
            {/* Top Row: Statistic + Budget Overview + Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Statistic */}
                <Card className="bg-slate-900 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Statistic</h3>
                    <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                        <div className="text-center text-slate-500 text-sm">
                            <p>Chart coming soon...</p>
                        </div>
                    </div>
                </Card>

                {/* Budget Overview */}
                <Card className="bg-slate-900 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Budget Overview</h3>
                    <div className="space-y-2 text-sm">
                        {[
                            { label: 'Food', value: 65, color: 'bg-amber-500' },
                            { label: 'Utilities', value: 45, color: 'bg-blue-500' },
                            { label: 'Clothes', value: 30, color: 'bg-purple-500' },
                            { label: 'Social', value: 20, color: 'bg-pink-500' },
                            { label: 'Invest', value: 15, color: 'bg-green-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-300 text-xs">{item.label}</span>
                                    <span className="text-slate-400 text-xs">{item.value}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color}`}
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Spending Pie Chart */}
                <Card className="bg-slate-900 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Spending</h3>
                    <SpendingPie />
                </Card>
            </div>

            {/* Bottom: Monthly Trend */}
            <Card className="bg-slate-900 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Trend</h3>
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                    <div className="text-center text-slate-500 text-sm">
                        <p>Chart coming soon...</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
