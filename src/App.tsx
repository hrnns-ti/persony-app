import { useState } from 'react';
import Sidebar from './components/dashboard/Sidebar';
import StatsCard from './components/finance/StatsCard';
import ActionCard from './components/finance/ActionCard';
import Card from './components/ui/Card';
import SpendingPie from './components/finance/SpendingPie';
import IncomeIcon from "./assets/icons/income.tsx";
import OutcomeIcon from "./assets/icons/outcome.tsx";

function App() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'homework' | 'finance'>('dashboard');

    return (
        <div className="font-inconsola font-semibold min-h-screen h-screen bg-main text-slate-100 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content - 2 Columns */}
            <main className="flex-1 bg-main overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="gap-6 grid grid-cols-4 h-full">
                        {/* LEFT COLUMN */}
                        <div className="col-span-3 space-y-6 flex flex-col">

                            {/* ROW 1: Stats */}
                            <div className="space-y-2 ">
                                {/* SUB-ROW 1: Stats Cards  */}
                                <div className="grid grid-cols-3 gap-4">
                                    <StatsCard label="Balance" value="325.8 K" change="+15.8%" icon="{$}" />
                                    <StatsCard label="Incomes" value="15.1 K" change="+9.2%" icon="{$}" />
                                    <StatsCard label="Outcomes" value="15.1 K" change="-8.3%" icon="{$}" />
                                </div>

                                {/* SUB-ROW 2: Action Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <ActionCard title="New Income" icon={<IncomeIcon className="w-7 h-7" />} color="white" />
                                    <ActionCard title="New Outcome" icon={<OutcomeIcon className="w-7 h-7" />} color="white" />
                                </div>
                            </div>

                            {/* ROW 2: Charts Section */}
                            <div className="grid grid-cols-[66%_32.5%] gap-4">
                                {/* Statistic */}
                                <Card className="bg-main border border-line">
                                    <h3 className="text-xs font-semibold text-white mb-4">Statistic</h3>
                                    <div className="h-40 bg-gradient-to-br from-grey to-grey rounded-lg flex items-center justify-center border border-dashed border-line">
                                        <p className="text-slate-500 text-sm">Chart coming soon...</p>
                                    </div>
                                </Card>

                                {/* Budget Overview */}
                                <Card className="bg-main border border-line">
                                    <h3 className="text-xs font-semibold text-white mb-4 col-span-full">Budget Overview</h3>
                                    <div className="space-y-2 text-sm">
                                        {[
                                            { label: 'Food', value: 65, color: 'bg-amber-500' },
                                            { label: 'Utilities', value: 45, color: 'bg-blue-500' },
                                            { label: 'Clothes', value: 30, color: 'bg-purple-500' },
                                            { label: 'Social', value: 20, color: 'bg-pink-500' },
                                            { label: 'Invest', value: 15, color: 'bg-emerald-500' },
                                        ].map((item) => (
                                            <div key={item.label}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-slate-300 text-xs">{item.label}</span>
                                                    <span className="text-slate-400 text-xs">{item.value}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-800 overflow-hidden">
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

                            {/* ROW 3: Savings Section */}
                            <Card className="bg-main border border-line">
                                <h3 className="text-xs font-semibold text-white mb-6">Savings</h3>
                                <div className="h-80 bg-gradient-to-br from-grey to-grey rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                                    <p className="text-slate-500">All savings will here, include create saving</p>
                                </div>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col space-y-6 ">

                            {/* ROW 1: Spending */}
                            <Card className="bg-main border border-line mt-4">
                                <h3 className="text-xs font-semibold text-white">Spending</h3>
                                <div className="flex flex-col items-center">
                                    {/* Pie Chart */}
                                    <div className="w-full flex justify-center">
                                        <SpendingPie />
                                    </div>

                                    {/* Legend */}
                                    <div className="w-full space-y-2 text-sm">
                                        {[
                                            { label: 'Food', color: 'bg-amber-500' },
                                            { label: 'Utilities', color: 'bg-blue-500' },
                                            { label: 'Clothes', color: 'bg-purple-500' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center space-x-1">
                                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                <span className="text-slate-300 text-xs">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* ROW 2: Empty/Future Content */}
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
