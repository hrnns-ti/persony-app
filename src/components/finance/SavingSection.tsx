interface SavingCardProps {
    name: string
    balance: number
    target?: number
}

export default function SavingCard({ name, balance, target }: SavingCardProps) {
    return (
        <div className="bg-secondary rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-white">{name}</span>
                <span className="text-xs text-slate-400">
          Rp {balance.toLocaleString()}
        </span>
            </div>
            {target && (
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${(balance / target) * 100}%` }}
                    />
                </div>
            )}
        </div>
    )
}