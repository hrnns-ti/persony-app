import { useState } from 'react';
import Sidebar from './components/dashboard/Sidebar';
import StatsCard from './components/finance/StatsCard';
import ActionCard from './components/finance/ActionCard';
import Card from './components/ui/Card';
import SpendingPie from './components/finance/SpendingPie';

function App() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'homework' | 'finance'>('dashboard');

    return (
        <div className="min-h-screen h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content - 2 Columns */}
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-3 gap-6 h-full">
                        {/* LEFT COLUMN (2 cols = 66%) */}
                        <div className="col-span-2 space-y-6 flex flex-col">

                            {/* ROW 1: Stats + Actions combined */}
                            <div className="space-y-4">
                                {/* SUB-ROW 1: Stats Cards (3 columns) */}
                                <div className="grid grid-cols-3 gap-4">
                                    <StatsCard label="Balance" value="325.8 K" change="+15.8%" icon="💵" />
                                    <StatsCard label="Incomes" value="15.1 K" change="+9.2%" icon="📈" />
                                    <StatsCard label="Outcomes" value="15.1 K" change="-8.3%" icon="📉" />
                                </div>

                                {/* SUB-ROW 2: Action Cards (2 columns) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ActionCard title="NEW INCOME" icon="💰" color="green" />
                                    <ActionCard title="NEW OUTCOME" icon="💸" color="red" />
                                </div>
                            </div>

                            {/* ROW 2: Charts Section (Statistic + Budget Overview) */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Statistic */}
                                <Card className="bg-slate-900 border border-slate-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Statistic</h3>
                                    <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                                        <p className="text-slate-500 text-sm">Chart coming soon...</p>
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
                            </div>

                            {/* ROW 3: Savings Section (Full width) */}
                            <Card className="bg-slate-900 border border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-6">Savings</h3>
                                <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                                    <p className="text-slate-500">All savings will here, include create saving</p>
                                </div>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN (1 col = 33%) */}
                        <div className="flex flex-col space-y-6">

                            {/* ROW 1: Spending (sejajar dengan ROW 1 left column) */}
                            <Card className="bg-slate-900 border border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Spending</h3>
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Pie Chart */}
                                    <div className="w-full flex justify-center">
                                        <SpendingPie />
                                    </div>

                                    {/* Legend */}
                                    <div className="w-full space-y-2 text-sm">
                                        {[
                                            { label: 'Food', color: 'bg-amber-500' },
                                            { label: 'College', color: 'bg-blue-500' },
                                            { label: 'Life', color: 'bg-purple-500' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                <span className="text-slate-300 text-xs">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* ROW 2: Empty/Future Content (sejajar dengan ROW 2 + 3 left column) */}
                            <div className="flex-1 space-y-6">
                                <Card className="bg-slate-900 border border-slate-700 h-full flex items-center justify-center">
                                    <div className="text-center text-slate-500">
                                        <p className="text-sm">More features coming soon...</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
