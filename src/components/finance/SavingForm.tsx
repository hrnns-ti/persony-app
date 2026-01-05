import { useState } from 'react'

interface SavingFormProps {
    onSubmit: (name: string, target: number, description?: string) => void
    onCancel: () => void
}

export default function SavingForm({ onSubmit, onCancel }: SavingFormProps) {
    const [form, setForm] = useState({ name: '', target: 0, description: '' })

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '') // Hanya angka
        const numValue = parseInt(rawValue) || 0
        setForm({ ...form, target: numValue })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim() || form.target <= 0) return

        onSubmit(form.name.trim(), form.target, form.description.trim() || undefined)
        setForm({ name: '', target: 0, description: '' })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
            {/* Goal Name */}
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">
                    Saving Name
                </label>
                <input
                    type="text"
                    placeholder="Emergency Fund, Bali Trip..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-main border border-line hover:border-slate-400 focus:border-slate-400 rounded-md px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400/50 transition-all duration-200 h-12"
                    required
                />
            </div>

            {/* Target Amount - FIXED */}
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">
                    Target Amount
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-white-400 text-sm font-mono font-semibold">Rp</span>
                    </div>
                    <input
                        type="text"
                        placeholder="5.000.000"
                        value={formatCurrency(form.target)}
                        onChange={handleAmountChange}
                        className="w-full pl-12 pr-4 py-3 text-right text-sm font-mono font-semibold text-slate-100 bg-main border border-line hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400/50 rounded-md transition-all duration-200 h-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        inputMode="numeric"
                    />
                </div>
                {form.target > 0 && (
                    <p className="text-xs text-emerald-400 mt-1 font-mono font-semibold ml-1">
                        {formatCurrency(form.target)}
                    </p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2 tracking-tight">
                    Notes (Optional)
                </label>
                <textarea
                    rows={4}
                    placeholder="What are you saving for?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-main border border-line hover:border-slate-400 focus:border-slate-400 rounded-md px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-state-400/50 resize-none transition-all duration-200 min-h-[100px]"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/50">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-line rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!form.name.trim() || form.target <= 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-900/20 disabled:to-slate-900/20 border border-line disabled:cursor-not-allowed text-sm font-semibold text-white rounded-lg shadow-xs shadow-emerald-950/50 hover:shadow-emerald-500/25 transition-all duration-200 backdrop-blur-sm disabled:shadow-none"
                >
                    {form.name.trim() && form.target > 0 ? 'Create Saving' : 'Fill form first'}
                </button>
            </div>
        </form>
    )
}
