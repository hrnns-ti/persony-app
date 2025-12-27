import { useState } from 'react';
import { useTransactions } from '../../hooks/transaction.hook.ts';
import { TransactionType } from '../../types';

export default function TransactionDebug() {
    const { items, loading, addTransaction, removeTransaction } = useTransactions();

    const [amount, setAmount] = useState<number | ''>('');
    const [type, setType] = useState<TransactionType>('income');
    const [category, setCategory] = useState('Test');
    const [description, setDescription] = useState('');

    async function handleAdd() {
        if (!amount) return;

        await addTransaction({
            type,
            amount: Number(amount),
            category,
            date: new Date(),
            description,
            paymentMethod: 'cash',
            tags: [],
        });

        setAmount('');
        setDescription('');
    }

    if (loading) {
        return <div style={{ padding: 16 }}>Loading transactions...</div>;
    }

    return (
        <div style={{ padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>
            <h2>Transaction Debug Panel</h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select
                    value={type}
                    onChange={e => setType(e.target.value as TransactionType)}
                >
                    <option value="income">Income</option>
                    <option value="outcome">Outcome</option>
                    <option value="saving">Saving</option>
                </select>

                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />

                <input
                    type="text"
                    placeholder="Category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />

                <button onClick={handleAdd}>Add</button>
            </div>

            <ul style={{ paddingLeft: 16 }}>
                {items.map(t => (
                    <li key={t.id}>
                        [{t.type}] {t.category} - {t.amount} • {t.date.toLocaleString()}
                        <button
                            onClick={() => removeTransaction(t.id)}
                            style={{ marginLeft: 8 }}
                        >
                            X
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
