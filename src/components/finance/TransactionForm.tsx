import React, { useState } from 'react'
import type { Transaction } from '../../types/finance.ts'

interface TransactionFormProps {
    type: 'income' | 'outcome'
    onSubmit: (tx: Omit<Transaction, 'id'>) => Promise<void> | void
    onCancel: () => void
}

export default function TransactionForm({ type, onSubmit, onCancel }: TransactionFormProps) {
    const [form, setForm] = useState({ amount: 0, category: '', description: '' })
    const [submitting, setSubmitting] = useState(false)

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '')
        const numValue = parseInt(rawValue) || 0
        setForm({ ...form, amount: numValue })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.category.trim() || form.amount <= 0 || submitting) return

        setSubmitting(true)
        try {
            await onSubmit({
                type,
                amount: Math.abs(form.amount),
                category: form.category.trim(),
                description: form.description.trim() || undefined,
                date: new Date()
            })

            setForm({ amount: 0, category: '', description: '' })
        } finally {
            setSubmitting(false)
        }
    }

    const incomeCategories = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other']
    const outcomeCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']
    const categories = type === 'income' ? incomeCategories : outcomeCategories
    const isIncome = type === 'income'

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">Amount</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-sm font-mono font-bold text-white-400">Rp</span>
                    </div>
                    <input
                        type="text"
                        placeholder="100.000"
                        value={formatCurrency(form.amount)}
                        onChange={handleAmountChange}
                        className="w-full pl-12 pr-4 py-3 text-right text-sm font-mono font-semibold text-slate-100 bg-main border border-line hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400/50 rounded-md transition-all h-12"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">Category</label>
                <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-main border border-line hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400/50 rounded-md px-4 py-3 text-sm"
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">Notes (Optional)</label>
                <textarea
                    rows={4}
                    placeholder={isIncome ? 'Where did this come from?' : 'What did you spend on?'}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-main border border-line hover:border-slate-400 focus:border-slate-400 resize-none rounded-md px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400/50 transition-all duration-200 min-h-[100px]"
                />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/50">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-all duration-200"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting || !form.category.trim() || form.amount <= 0}
                    className={`px-6 py-2.5 text-sm rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isIncome
                            ? 'bg-main border border-line hover:text-emerald-400 hover:border-emerald-400'
                            : 'bg-main border border-line hover:text-red hover:border-red'
                    }`}
                >
                    {submitting ? 'Saving...' : (isIncome ? 'Add Income' : 'Add Outcome')}
                </button>
            </div>
        </form>
    )
}
