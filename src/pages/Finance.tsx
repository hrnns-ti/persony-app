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
import { Saving } from "../assets/icons";
import TransactionForm from "../components/finance/TransactionForm.tsx";
import StatisticsChart from '../components/finance/StatisticsChart'

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'learning' | 'finance'>('finance')

    const [isSavingModalOpen, setIsSavingModalOpen] = useState(false)
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
    const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false)

    const { transactions, addTransaction, loading } = useTransactions()
    const { savings, addSaving, updateSaving } = useSavings()

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

    const handleNewIncome = () => {
        setIsIncomeModalOpen(true) // ✅ TRIGGER MODAL, BUKAN HARDCODED
    }

    const handleAddIncome = (amount: number, category: string, description?: string) => {
        addTransaction({
            type: 'income',
            amount,
            category,
            date: new Date(),
            description
        })
        setIsIncomeModalOpen(false)
    }

    const handleNewOutcome = () => {
        setIsOutcomeModalOpen(true)
    }

    const handleAddOutcome = (amount: number, category: string, description?: string) => {
        addTransaction({
            type: 'outcome',
            amount: -amount, // Negative for outcome
            category,
            date: new Date(),
            description
        })
        setIsOutcomeModalOpen(false)
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

    const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit')
    const [selectedSavingId, setSelectedSavingId] = useState('')
    const [amount, setAmount] = useState(0)

    // Helper functions
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID').format(value)
    }

    const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '')
        setAmount(parseInt(rawValue) || 0)
    }

    const handleDepositWithdraw = async () => {
        if (!selectedSavingId || amount <= 0) return

        try {
            const saving = savings.find(s => s.id === selectedSavingId)
            if (!saving) return

            // Simulate deposit/withdraw via updateSaving
            const newBalance = actionType === 'deposit'
                ? saving.balance + amount
                : saving.balance - amount

            if (newBalance < 0) {
                alert('Insufficient balance!')
                return
            }

            await updateSaving(selectedSavingId, { balance: newBalance })

            setAmount(0)
            setSelectedSavingId('')
        } catch (error) {
            console.error('Deposit/Withdraw failed:', error)
        }
    }

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
                            </div>

                            {/* ROW 2: Charts Section + Action Cards */}
                            <div className="grid grid-cols-[66%_32.2%] gap-4 flex-shrink-0">
                                {/* Statistic */}
                                <StatisticsChart transactions={transactions || []} />

                                {/* Action Cards - CONNECTED TO HOOKS */}
                                <div className="grid grid-row-3 h-[80%] gap-4">
                                    <div className="flex-1 overflow-hidden">
                                        <img
                                            src="/assets/eyes.gif"
                                            alt="Eyes GIF"
                                            className="w-full h-full border border-line rounded-lg object-cover object-center"
                                        />
                                    </div>
                                    {/* Budget Overview */}
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
                            </div>

                            {/* ROW 3: Savings Section */}
                            <Card className="bg-main border border-line flex-1 flex flex-col overflow-hidden">
                                <h3 className="text-sm font-semibold text-slate-400 mb-4 flex-shrink-0">Savings</h3>

                                {/* Scrollable savings container */}
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
                            {/* Top: GIF/Empty */}
                            <div className="flex-1 mt-4 overflow-hidden">
                                <img
                                    src="/assets/night.jpg"
                                    alt="Eyes GIF"
                                    className="w-full h-full border border-line rounded-lg object-cover object-bottom"
                                />
                            </div>

                            {/* Bottom: FULL SAVINGS */}
                            <div className="flex flex-col space-y-4">
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
                                    icon={<Saving className="w-6 h-6" />}
                                    color="slate-400"
                                    onClick={handleNewSaving}
                                />

                                {/* Savings Actions */}
                                <Card className="bg-main border border-line p-2">
                                    <h3 className="text-sm text-slate-400 m-4 tracking-wider">
                                        Saving Transaction
                                    </h3>

                                    {/* Toggle */}
                                    <div className="grid grid-cols-2 mx-2 gap-3 mb-4">
                                        <button
                                            onClick={() => setActionType('deposit')}
                                            className={`p-2 rounded-md transition-all font-mono ${
                                                actionType === 'deposit'
                                                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 text-emerald-200'
                                                    : 'bg-secondary border border-line hover:border-line hover:bg-line text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <div className="text-sm">Deposit</div>
                                        </button>
                                        <button
                                            onClick={() => setActionType('withdraw')}
                                            className={`p-2 rounded-md transition-all font-mono ${
                                                actionType === 'withdraw'
                                                    ? 'bg-gradient-to-r from-red/40 to-red/30 border border-red text-white'
                                                    : 'bg-secondary border border-line hover:border-line hover:bg-line text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <div className="text-sm">Withdraw</div>
                                        </button>
                                    </div>

                                    {/* Amount */}
                                    <div className="relative mb-4 mx-2 rounded-md">
                                        <div className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                            <span className="text-slate-400 text-sm">Rp</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="100.000"
                                            value={formatCurrency(amount)}
                                            onChange={handleAmountInputChange}
                                            className="w-full pl-12 pr-4 text-right text-sm font-mono bg-secondary border border-line hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 rounded-md transition-all h-14"
                                        />
                                    </div>

                                    {/* Dropdown */}
                                    <select
                                        value={selectedSavingId}
                                        onChange={(e) => setSelectedSavingId(e.target.value)}
                                        className="w-[93.3%] bg-secondary mx-2 savings-scroll border border-line hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring focus:ring-line rounded-md px-2 py-4 text-sm font-mono mb-4 text-slate-400"
                                        disabled={!savings.length}
                                    >
                                        <option value="">Pilih Savings</option>
                                        {savings.map((saving) => (
                                            <option key={saving.id} value={saving.id}>
                                                {saving.name}
                                                <span className="ml-4 opacity-75">
                                                    ({formatCurrency(saving.balance)}
                                                    {saving.target && ` / ${formatCurrency(saving.target)}`})
                                                </span>
                                            </option>
                                        ))}
                                    </select>

                                    {/* Button */}
                                    <button
                                        onClick={handleDepositWithdraw}
                                        disabled={!selectedSavingId || amount <= 0}
                                        className="w-[93%] m-2 py-4 px-4 text-sm bg-secondary hover:from-secondary border border-line disabled:cursor-not-allowed text-white rounded-md  transition-all duration-300 font-mono tracking-wide
                                        hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-emerald-600/20 hover:border-emerald-500/50 hover:text-emerald-200"
                                    >
                                        {actionType === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
                                    </button>
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

            <Modal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                title="Add Income"
            >
                <TransactionForm
                    type="income"
                    onSubmit={handleAddIncome}
                    onCancel={() => setIsIncomeModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={isOutcomeModalOpen}
                onClose={() => setIsOutcomeModalOpen(false)}
                title="Add Outcome"
            >
                <TransactionForm
                    type="outcome"
                    onSubmit={handleAddOutcome}
                    onCancel={() => setIsOutcomeModalOpen(false)}
                />
            </Modal>
        </div>
    )
}