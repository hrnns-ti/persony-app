import React, { useMemo, useState } from 'react'
import StatsCard from "../components/finance/StatsCard.tsx";
import ActionCard from '../components/finance/ActionCard'
import Card from '../components/ui/Card'
import IncomeIcon from '../assets/icons/income.tsx'
import OutcomeIcon from '../assets/icons/outcome.tsx'
import Modal from '../components/ui/Modal'
import SavingForm from '../components/finance/SavingForm'
import TransactionForm from "../components/finance/TransactionForm.tsx";
import StatisticsChart from '../components/finance/StatisticsChart'
import { Saving } from "../assets/icons";

import { useTransactions } from '../hooks/finance/transaction'
import { useSavings } from '../hooks/finance/saving'
import { useSavingTransactions } from '../hooks/finance/savingTransaction'

import type { Saving as SavingType, Transaction, SavingTransaction } from '../types/finance.ts'

export default function FinancePage() {
    const [isSavingModalOpen, setIsSavingModalOpen] = useState(false)
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
    const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false)

    const { transactions, addTransaction, loading } = useTransactions()
    const { savings, addSaving, deleteSaving, refresh: refreshSavings } = useSavings()

    const {
        addTransaction: addSavingTx,
        refresh: refreshSavingTx
    } = useSavingTransactions()

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [savingToDelete, setSavingToDelete] = useState<SavingType | null>(null)

    const stats = useMemo(() => {
        const s = {
            balance: 0,
            totalIncome: 0,
            totalOutcome: 0,
            spending: {} as Record<string, number>
        }

        if (!transactions || transactions.length === 0) return s

        s.totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        s.totalOutcome = transactions
            .filter(t => t.type === 'outcome')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        s.balance = s.totalIncome - s.totalOutcome

        for (const t of transactions) {
            if (t.type === 'outcome') {
                s.spending[t.category] = (s.spending[t.category] || 0) + Math.abs(t.amount)
            }
        }

        return s
    }, [transactions])

    const outcomeItems = useMemo(() => {
        return stats.spending
            ? Object.entries(stats.spending)
                .sort(([, a], [, b]) => b - a)
                .map(([label, value]) => ({
                    label,
                    value,
                    percentage: (value / (stats.totalOutcome || 1)) * 100
                }))
                .slice(0, 10)
            : []
    }, [stats.spending, stats.totalOutcome])

    const handleNewIncome = () => setIsIncomeModalOpen(true)
    const handleNewOutcome = () => setIsOutcomeModalOpen(true)
    const handleNewSaving = () => setIsSavingModalOpen(true)

    const handleSubmitIncome = async (tx: Omit<Transaction, 'id'>) => {
        try {
            await addTransaction(tx)
            setIsIncomeModalOpen(false)
        } catch (e) {
            console.error(e)
            alert('Gagal menambah income')
        }
    }

    const handleSubmitOutcome = async (tx: Omit<Transaction, 'id'>) => {
        try {
            await addTransaction(tx)
            setIsOutcomeModalOpen(false)
        } catch (e) {
            console.error(e)
            alert('Gagal menambah outcome')
        }
    }

    const handleSubmitSaving = async (saving: Omit<SavingType, 'id' | 'balance' | 'createdAt'>) => {
        try {
            await addSaving(saving)
            setIsSavingModalOpen(false)
        } catch (e) {
            console.error(e)
            alert('Gagal membuat saving')
        }
    }

    const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit')
    const [selectedSavingId, setSelectedSavingId] = useState('')
    const [amount, setAmount] = useState(0)

    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID').format(value)

    const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '')
        setAmount(parseInt(rawValue) || 0)
    }

    const handleDepositWithdraw = async () => {
        if (!selectedSavingId || amount <= 0) return

        try {
            const tx: Omit<SavingTransaction, 'id'> = {
                savingID: selectedSavingId,
                type: actionType,
                amount: Math.abs(amount),
                date: new Date(),
                description: actionType === 'deposit' ? 'Deposit' : 'Withdraw'
            }

            await addSavingTx(tx)

            await refreshSavings()
            await refreshSavingTx()

            setAmount(0)
            setSelectedSavingId('')
        } catch (error) {
            console.error('Deposit/Withdraw failed:', error)
            alert(error instanceof Error ? error.message : 'Deposit/Withdraw gagal')
        }
    }

    const formatCurrencyCompact = (value: number): string => {
        const absValue = Math.abs(value)
        if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
        if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
        if (absValue >= 1_000) return `${(value / 1_000).toFixed(1)}K`
        return value.toLocaleString()
    }

    const getMonthlyChange = (txs: any[], type: 'income' | 'outcome'): string => {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const thisMonthData = txs
            .filter(t => t.type === type && new Date(t.date) >= thisMonth)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const lastMonthData = txs
            .filter(t => t.type === type && new Date(t.date) >= lastMonth && new Date(t.date) < thisMonth)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        if (lastMonthData === 0) return ''

        const change = ((thisMonthData - lastMonthData) / lastMonthData) * 100
        const sign = change >= 0 ? '+' : ''
        return `${sign}${change.toFixed(1)}% since last month`
    }

    const getBalanceChange = (txs: any[]): string => {
        return getMonthlyChange(txs, 'income')
    }

    const outcomeColors = ['bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500']

    if (loading) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>

    return (
        <div className="font-inconsola font-semibold min-h-screen h-screen bg-main text-slate-100 flex overflow-hidden">
            {/* Main Content - 2 Columns */}
            <main className="flex-1 bg-main overflow-hidden flex flex-col">
                <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <div className="gap-4 grid grid-cols-4 h-full overflow-hidden">
                        {/* LEFT COLUMN */}
                        <div className="col-span-3 flex flex-col overflow-hidden">

                            {/* ROW 1: Stats */}
                            <div className="space-y-2 flex-shrink-0">
                                <div className="grid grid-cols-3 gap-4">
                                    <StatsCard
                                        label="Balance"
                                        value={formatCurrencyCompact(stats.balance)}
                                        change={getBalanceChange(transactions)}
                                        icon="$"
                                    />
                                    <StatsCard
                                        label="Incomes"
                                        value={formatCurrencyCompact(stats.totalIncome)}
                                        change={getMonthlyChange(transactions, 'income')}
                                        icon="$"
                                    />
                                    <StatsCard
                                        label="Outcomes"
                                        value={formatCurrencyCompact(stats.totalOutcome)}
                                        change={getMonthlyChange(transactions, 'outcome')}
                                        icon="$"
                                        invertChange={true}
                                    />
                                </div>
                            </div>

                            {/* ROW 2 */}
                            <div className="grid grid-cols-2 w-[133.7%] h-[40%] gap-4 mb-4 flex-shrink-0">
                                <StatisticsChart transactions={transactions || []} />

                                <div className="grid grid-cols-2 gap-4 ">
                                    <div className="gap-4">
                                        <Card className="bg-main border h-full border-line">
                                            <h3 className="text-sm font-semibold text-slate-400 mb-5 col-span-full">Outcome Overview</h3>
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
                            </div>

                            {/* ROW 3: Savings */}
                            <div className="bg-main flex flex-col overflow-hidden">
                                <Card className="bg-main border border-line flex flex-col overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex-shrink-0">Savings</h3>

                                    <div className="flex-1 overflow-y-auto pr-2 savings-scroll">
                                        {savings && savings.length > 0 ? (
                                            <div className="space-y-3">
                                                {savings.map((saving) => (
                                                    <div
                                                        key={saving.id}
                                                        className="bg-secondary rounded-lg p-4 border border-line flex-shrink-0 group relative"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setSavingToDelete(saving)
                                                                setDeleteConfirmId(saving.id)
                                                            }}
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-main border border-slate-400 hover:border-red flex items-center justify-center text-slate-400 hover:text-red text-xs font-bold transition-all"
                                                            title="Hapus saving"
                                                        >
                                                            ×
                                                        </button>

                                                        <div className="flex justify-between items-start mb-2 pt-1 pr-8">
                                                            <span className="text-xs font-semibold text-slate-400">{saving.name}</span>
                                                            <span className="text-xs text-slate-400 ml-2">
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
                                                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{saving.description}</p>
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

                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col space-y-4 overflow-hidden">
                            <div className="flex-1 mt-4 space-y-4 overflow-hidden">
                                <div className="flex flex-col space-y-2">
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
                                </div>

                                <img
                                    src="/assets/night.jpg"
                                    alt="Eyes GIF"
                                    className="w-full border h-[62.5%] border-line rounded-lg object-cover object-bottom"
                                />
                            </div>

                            {/* Savings Actions */}
                            <Card className="bg-main border border-line">
                                <h3 className="text-sm text-slate-400 mb-16 mx-2 tracking-wider">
                                    Saving Transaction
                                </h3>

                                {/* Toggle */}
                                <div className="grid grid-cols-2 mx-2 gap-3 mb-4">
                                    <button
                                        type="button"
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
                                        type="button"
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
                                            {saving.name} ({formatCurrency(saving.balance)}
                                            {saving.target && ` / ${formatCurrency(saving.target)}`})
                                        </option>
                                    ))}
                                </select>

                                {/* Button */}
                                <button
                                    type="button"
                                    onClick={handleDepositWithdraw}
                                    disabled={!selectedSavingId || amount <= 0}
                                    className="w-[93.3%] mx-2 py-4 text-sm bg-secondary hover:from-secondary border border-line disabled:cursor-not-allowed text-white rounded-md transition-all duration-300 font-mono tracking-wide hover:border-emerald-500/50 hover:text-emerald-400"
                                >
                                    {actionType === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
                                </button>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal
                isOpen={isSavingModalOpen}
                onClose={() => setIsSavingModalOpen(false)}
                title="New Saving Goal"
            >
                <SavingForm
                    onSubmit={handleSubmitSaving}
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
                    onSubmit={handleSubmitIncome}
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
                    onSubmit={handleSubmitOutcome}
                    onCancel={() => setIsOutcomeModalOpen(false)}
                />
            </Modal>

            {/* DELETE CONFIRM MODAL */}
            {savingToDelete && deleteConfirmId && (
                <Modal
                    isOpen={true}
                    onClose={() => {
                        setDeleteConfirmId(null)
                        setSavingToDelete(null)
                    }}
                    title="Delete Saving?"
                >
                    <div className="space-y-4 text-center p-6">
                        <p className="text-slate-300 text-sm">
                            Are you sure to delete <strong className="text-white">"{savingToDelete.name}"</strong>?
                        </p>
                        <div className="text-xs text-slate-500 px-4 pb-14 rounded-md">
                            Balance <strong>Rp {savingToDelete.balance.toLocaleString()}</strong> will disappear
                        </div>
                        <div className="flex gap-24 pt-6">
                            <button
                                onClick={async () => {
                                    try {
                                        if (deleteConfirmId) {
                                            await deleteSaving(deleteConfirmId)
                                            setDeleteConfirmId(null)
                                            setSavingToDelete(null)
                                        }
                                    } catch (error) {
                                        console.error('Delete failed:', error)
                                        alert('Gagal hapus saving!')
                                    }
                                }}
                                className="flex-1 bg-main hover:text-red font-mono py-3 mx-6 rounded-md border border-red transition-all font-semibold"
                            >
                                Delete Permanently
                            </button>
                            <button
                                onClick={() => {
                                    setDeleteConfirmId(null)
                                    setSavingToDelete(null)
                                }}
                                className="flex-1 bg-secondary hover:bg-slate-800 text-slate-300 font-mono py-3 mx-6 rounded-md border border-line transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
