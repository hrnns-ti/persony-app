import { useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import StatsCard from '../components/finance/StatsCard'
import ActionCard from '../components/finance/ActionCard'
import Card from '../components/ui/Card'
import IncomeIcon from '../assets/icons/income.tsx'
import OutcomeIcon from '../assets/icons/outcome.tsx'
import { useTransactions } from '../hooks/finance/transaction'
import { useSavings } from '../hooks/finance/saving'
import Modal from '../components/ui/Modal'
import SavingForm from '../components/finance/SavingForm'

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'homework' | 'finance'>('finance')
    const [isSavingModalOpen, setIsSavingModalOpen] = useState(false)
    const { transactions, addTransaction, loading } = useTransactions()
    const { savings, addSaving } = useSavings()

    // Calculate stats from transactions
    const stats = {
        balance: 0,
        totalIncome: 0,
        totalOutcome: 0,
        spending: {} as Record<string, number>
    }

    if (transactions && transactions.length > 0) {
        stats.totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        stats.totalOutcome = transactions
            .filter(t => t.type === 'outcome')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        stats.balance = stats.totalIncome - stats.totalOutcome

        transactions.forEach(t => {
            if (t.type === 'outcome') {
                stats.spending[t.category] = (stats.spending[t.category] || 0) + Math.abs(t.amount)
            }
        })
    }

    // Quick actions
    const handleNewIncome = () => {
        addTransaction({
            type: 'income',
            amount: 250000,
            category: 'Salary',
            date: new Date()
        })
    }

    const handleNewOutcome = () => {
        addTransaction({
            type: 'outcome',
            amount: 45000,
            category: 'Food',
            date: new Date()
        })
    }

    const handleNewSaving = () => {
        setIsSavingModalOpen(true)
    }

    const handleSaveSaving = (name: string, target: number, description?: string) => {
        addSaving({
            name,
            target,
            description
        })
        setIsSavingModalOpen(false)
    }

    // Calculate outcome percentages for bars
    const outcomeItems = stats.spending
        ? Object.entries(stats.spending)
            .map(([label, value]) => ({
                label,
                value,
                percentage: (value / (stats.totalOutcome || 1)) * 100
            }))
            .slice(0, 5)
        : []

    const outcomeColors = ['bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500']

    if (loading) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>

    return (
        <div className="font-inconsola font-semibold min-h-screen h-screen bg-main text-slate-100 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content - 2 Columns */}
            <main className="flex-1 bg-main overflow-hidden flex flex-col">
                <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <div className="gap-6 grid grid-cols-4 h-full overflow-hidden">
                        {/* LEFT COLUMN */}
                        <div className="col-span-3 space-y-6 flex flex-col overflow-hidden">

                            {/* ROW 1: Stats */}
                            <div className="space-y-2 flex-shrink-0">
                                {/* SUB-ROW 1: Stats Cards - DYNAMIC DATA */}
                                <div className="grid grid-cols-3 gap-4">
                                    <StatsCard
                                        label="Balance"
                                        value={`${(stats.balance / 1000).toFixed(1)} K`}
                                        change={stats.balance > 0 ? '+15.8%' : '-2.3%'}
                                        icon="{$}"
                                    />
                                    <StatsCard
                                        label="Incomes"
                                        value={`${(stats.totalIncome / 1000).toFixed(1)} K`}
                                        change="+9.2%"
                                        icon="{$}"
                                    />
                                    <StatsCard
                                        label="Outcomes"
                                        value={`${(stats.totalOutcome / 1000).toFixed(1)} K`}
                                        change="-8.3%"
                                        icon="{$}"
                                    />
                                </div>

                                {/* SUB-ROW 2: Action Cards - CONNECTED TO HOOKS */}
                                <div className="grid grid-cols-3 gap-4">
                                    <ActionCard
                                        title="New Income"
                                        icon={<IncomeIcon className="w-7 h-7" />}
                                        color="slate-400"
                                        onClick={handleNewIncome}
                                    />
                                    <ActionCard
                                        title="New Outcome"
                                        icon={<OutcomeIcon className="w-7 h-7" />}
                                        color="slate-400"
                                        onClick={handleNewOutcome}
                                    />
                                    <ActionCard
                                        title="New Saving"
                                        icon="🏦"
                                        color="slate-400"
                                        onClick={handleNewSaving}
                                    />
                                </div>
                            </div>

                            {/* ROW 2: Charts Section */}
                            <div className="grid grid-cols-[66%_32.2%] gap-4 flex-shrink-0">
                                {/* Statistic */}
                                <Card className="bg-main border border-line">
                                    <h3 className="text-sm font-semibold text-slate-400 mb-4">Statistic</h3>
                                    <div className="h-40 bg-gradient-to-br from-grey to-grey rounded-lg flex items-center justify-center border border-dashed border-line">
                                        <p className="text-slate-500 text-sm">Chart coming soon...</p>
                                    </div>
                                </Card>

                                {/* Budget Overview - DYNAMIC DATA */}
                                <Card className="bg-main border border-line">
                                    <h3 className="text-sm font-semibold text-slate-400 mb-4 col-span-full">Outcome Overview</h3>
                                    <div className="space-y-2 text-sm">
                                        {outcomeItems.length > 0 ? (
                                            outcomeItems.map((item, idx) => (
                                                <div key={item.label}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-slate-300 text-xs">{item.label}</span>
                                                        <span className="text-slate-400 text-xs">{item.percentage.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-800 overflow-hidden">
                                                        <div
                                                            className={`h-full ${outcomeColors[idx % outcomeColors.length]}`}
                                                            style={{ width: `${item.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-xs">No outcome data yet</p>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* ROW 3: Savings Section - SCROLL HANYA DI SINI */}
                            <Card className="bg-main border border-line flex-1 flex flex-col overflow-hidden">
                                <h3 className="text-sm font-semibold text-slate-400 mb-4 flex-shrink-0">Savings</h3>

                                {/* Scrollable savings container - flex-1 untuk ambil sisa space */}
                                <div className="flex-1 overflow-y-auto pr-2 savings-scroll">
                                    {savings && savings.length > 0 ? (
                                        <div className="space-y-3">
                                            {savings.map((saving) => (
                                                <div key={saving.id} className="bg-secondary rounded-lg p-4 border border-line flex-shrink-0">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-semibold text-slate-400">{saving.name}</span>
                                                        <span className="text-xs text-slate-400">
                                                          {saving.target
                                                              ? `Rp ${saving.balance.toLocaleString()} / ${saving.target.toLocaleString()}`
                                                              : `Rp ${saving.balance.toLocaleString()}`
                                                          }
                                                        </span>
                                                    </div>
                                                    {saving.target && (
                                                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500"
                                                                style={{ width: `${(saving.balance / saving.target) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                    {saving.description && (
                                                        <p className="text-xs text-slate-500 mt-2">{saving.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center border border-dashed border-slate-700 rounded-lg">
                                            <p className="text-slate-500 text-sm">No savings yet</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col space-y-6 overflow-hidden">
                            {/* ROW 1: Empty/Future Content */}
                            <div className="flex-1 mt-4 overflow-hidden">
                                <img
                                    src="/assets/night.jpg"
                                    alt="Eyes GIF"
                                    className={"w-full h-full border border-line rounded-lg object-cover object-center"}
                                />
                            </div>

                            {/* ROW 2: Empty/Future Content */}
                            <div className="flex-1 overflow-hidden">
                                <Card className="bg-main border border-line h-full flex items-center justify-center">
                                    <div className="text-center text-slate-500">
                                        <p className="text-sm">More features coming soon...</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Modal
                isOpen={isSavingModalOpen}
                onClose={() => setIsSavingModalOpen(false)}
                title="New Saving Goal"
            >
                <SavingForm
                    onSubmit={handleSaveSaving}
                    onCancel={() => setIsSavingModalOpen(false)}
                />
            </Modal>
        </div>
    )
}
