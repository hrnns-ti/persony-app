import { useEffect, useState } from 'react';
import { Transaction } from '../types';
import transactionService from '../services/transaction.service';

export function useTransactions() {
    const [items, setItems] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            const data = await transactionService.getAll();
            if (!mounted) return;
            setItems(data);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    async function addTransaction(input: Omit<Transaction, 'id'>) {
        const created = await transactionService.add(input);
        setItems(prev => [...prev, created]);
    }

    async function removeTransaction(id: string) {
        await transactionService.remove(id);
        setItems(prev => prev.filter(t => t.id !== id));
    }

    return {
        items,
        loading,
        addTransaction,
        removeTransaction,
    };
}
