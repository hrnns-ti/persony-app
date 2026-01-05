import React, { useState } from 'react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts'
import Card from '../ui/Card'

interface ChartData {
    date: string
    income: number
    outcome: number
    balance: number
}

interface StatisticsChartProps {
    transactions: any[]
    height?: number
}

type FilterType = 'today' | 'week' | 'month' | 'year'

const StatisticsChart: React.FC<StatisticsChartProps> = ({ transactions = [], height = 280 }) => {
    const [filter, setFilter] = useState<FilterType>('month')

    const generateChartData = (): ChartData[] => {
        const data: Record<string, ChartData> = {}
        const now = new Date()

        transactions.forEach((tx: any) => {
            const txDate = new Date(tx.date)
            let key = ''
            let shouldInclude = false

            if (filter === 'today') {
                if (txDate.toDateString() === now.toDateString()) {
                    key = txDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    shouldInclude = true
                }
            } else if (filter === 'week') {
                const daysDiff = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
                if (daysDiff >= 0 && daysDiff <= 7) {
                    key = txDate.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' })
                    shouldInclude = true
                }
            } else if (filter === 'month') {
                const monthsDiff = (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth())
                if (monthsDiff >= 0 && monthsDiff <= 6) {
                    key = txDate.toLocaleDateString('id-ID', { year: '2-digit', month: 'short' })
                    shouldInclude = true
                }
            } else if (filter === 'year') {
                const yearsDiff = now.getFullYear() - txDate.getFullYear()
                if (yearsDiff >= 0 && yearsDiff <= 5) {
                    key = txDate.toLocaleDateString('id-ID', { year: 'numeric' })
                    shouldInclude = true
                }
            }

            if (shouldInclude) {
                if (!data[key]) {
                    data[key] = { date: key, income: 0, outcome: 0, balance: 0 }
                }

                if (tx.type === 'income') {
                    data[key].income += tx.amount
                } else {
                    data[key].outcome += Math.abs(tx.amount)
                }

                data[key].balance = data[key].income - data[key].outcome
            }
        })

        return Object.values(data).sort((a, b) => {
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateA.getTime() - dateB.getTime()
        })
    }

    const chartData = generateChartData()

    const getMaxValue = () => {
        return Math.max(
            ...chartData.map(d => Math.max(d.income, d.outcome, Math.abs(d.balance)))
        )
    }

    const getScaleLabel = () => {
        const max = getMaxValue()
        if (max >= 1000000) return { divisor: 1000000, label: 'M' }
        if (max >= 1000) return { divisor: 1000, label: 'K' }
        return { divisor: 1, label: '' }
    }

    const scale = getScaleLabel()

    const formatYAxis = (value: number) => {
        if (scale.label === 'M') return `${(value / 1000000).toFixed(0)}M`
        if (scale.label === 'K') return `${(value / 1000).toFixed(0)}K`
        return `${value}`
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-950 border border-slate-700/80 backdrop-blur-xl rounded-lg p-2 shadow-2xl shadow-slate-900/50 min-w-[160px]">
                    <p className="text-slate-300 text-xs font-bold font-mono mb-1">{payload[0].payload.date}</p>
                    <div className="border-t border-slate-700/50 pt-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-xs mb-0.5">
                                <span className="font-mono text-slate-400">{entry.name}</span>
                                <span className="font-bold font-mono" style={{ color: entry.color }}>
                                    {scale.label === 'M' && `Rp ${(entry.value / 1000000).toFixed(1)}M`}
                                    {scale.label === 'K' && `Rp ${(entry.value / 1000).toFixed(1)}K`}
                                    {scale.label === '' && `Rp ${entry.value}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="bg-gradient-to-br from-grey to-grey border h-full   border-line overflow-hidden">
            <div className=" flex flex-col gap-4">
                {/* Header + Filter */}
                <div className="flex items-center justify-between pb-4">
                    <h3 className="text-sm text-slate-400 font-mono">Statistics</h3>

                    {/* Filter Buttons - FIXED */}
                    <div className="flex gap-1 bg-secondary border border-line rounded-md p-1">
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                                filter === 'today'
                                    ? 'bg-blue-400/30 border border-blue-400/30 text-blue-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setFilter('week')}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                                filter === 'week'
                                    ? 'bg-blue-400/30 border border-blue-400/30 text-blue-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setFilter('month')}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                                filter === 'month'
                                    ? 'bg-blue-400/30 border border-blue-400/30 text-blue-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setFilter('year')}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                                filter === 'year'
                                    ? 'bg-blue-400/30 border border-blue-400/30 text-blue-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Year
                        </button>
                    </div>
                </div>

                {/* Chart */}
                <ResponsiveContainer width="100%" height={height*.89}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid
                            vertical={false}
                            stroke="rgba(148, 163, 184, 0.08)"
                            strokeDasharray="4 4"
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inconsolata, monospace' }}
                            tickMargin={12}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inconsolata, monospace' }}
                            tickMargin={12}
                            tickFormatter={formatYAxis}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 11, fontFamily: 'Inconsolata, monospace', paddingTop: '12px' }}
                            iconType="circle"
                            iconSize={5}
                            verticalAlign="bottom"
                            height={20}
                        />

                        {/* 3 Lines */}
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                            name="Income"
                            animationDuration={600}
                            isAnimationActive={true}
                        />
                        <Line
                            type="monotone"
                            dataKey="outcome"
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                            name="Outcome"
                            animationDuration={600}
                            isAnimationActive={true}
                        />
                        <Line
                            type="monotone"
                            dataKey="balance"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                            name="Balance"
                            animationDuration={600}
                            isAnimationActive={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}

export default StatisticsChart
