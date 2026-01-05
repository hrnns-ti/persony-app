import { useState } from 'react'

interface TransactionFormProps {
    type: 'income' | 'outcome'
    onSubmit: (amount: number, category: string, description?: string) => void
    onCancel: () => void
}

export default function TransactionForm({ type, onSubmit, onCancel }: TransactionFormProps) {
    const [form, setForm] = useState({ amount: 0, category: '', description: '' })

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '')
        const numValue = parseInt(rawValue) || 0
        setForm({ ...form, amount: numValue })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.category.trim() || form.amount <= 0) return

        onSubmit(form.amount, form.category.trim(), form.description.trim() || undefined)
        setForm({ amount: 0, category: '', description: '' })
    }

    // Categories
    const incomeCategories = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other']
    const outcomeCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education','Other']
    const categories = type === 'income' ? incomeCategories : outcomeCategories
    const isIncome = type === 'income'

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
            {/* Amount */}
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">
                    Amount
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className={`text-sm font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>Rp</span>
                    </div>
                    <input
                        type="text"
                        placeholder="100.000"
                        value={formatCurrency(form.amount)}
                        onChange={handleAmountChange}
                        className="w-full pl-12 pr-4 py-3 text-right text-sm font-mono font-semibold text-slate-100 bg-main border border-line hover:border-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 rounded-lg transition-all h-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                    />
                </div>
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">
                    Category
                </label>
                <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-main border border-line hover:border-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 rounded-lg px-4 py-3 text-sm"
                    required
                >
                    <option value="">📂 Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">
                    Notes (Optional)
                </label>
                <textarea
                    rows={4}
                    placeholder={isIncome ? 'Where did this come from?' : 'What did you spend on?'}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-main border border-line hover:border-slate-400 focus:border-emerald-400 resize-none rounded-lg px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-main transition-all duration-200 min-h-[100px]"
                />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/50">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!form.category.trim() || form.amount <= 0}
                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-lg transition-all duration-200 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                        isIncome
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-950/50 hover:shadow-emerald-500/25'
                            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-950/50 hover:shadow-red-500/25'
                    }`}
                >
                    {isIncome ? '💰 Add Income' : '💸 Add Outcome'}
                </button>
            </div>
        </form>
    )
}
