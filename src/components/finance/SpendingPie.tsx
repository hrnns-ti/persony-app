import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#22c55e'];

interface SpendingData {
    name: string;
    value: number;
}

interface SpendingPieProps {
    data?: SpendingData[];
}

export default function SpendingPie({ data }: SpendingPieProps) {
    const defaultData = [
        { name: 'Food', value: 65 },
        { name: 'Utilities', value: 45 },
        { name: 'Clothes', value: 30 },
        { name: 'Social', value: 20 },
        { name: 'Invest', value: 15 },
    ] as SpendingData[];  // ← ADD THIS

    const chartData = data || defaultData;

    return (
        <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={chartData as any[]}  // ← TYPE ASSERTION
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={10}
                        dataKey="value"
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => [`${value}%`, 'Percentage']}
                        contentStyle={{
                            background: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
