import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
        { name: 'Food', value: 45 },
        { name: 'Utilities', value: 32 },
        { name: 'Clothes', value: 21 },
        { name: 'Social', value: 15 },
        { name: 'Invest', value: 10 },
    ];

    const chartData = data || defaultData;

    return (
        <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}