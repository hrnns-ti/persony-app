import { useState, useEffect } from 'react';
import { SavingTransaction, SavingTransactionFilter } from '../../types/finance.type';
import savingTransactionService from '../../services/finance.service/savingTransaction';

export function useSavingTransactions(savingId?: string) {
    const [transactions, setTransactions] = useState<SavingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTransactions();
    }, [savingId]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = savingId
                ? await savingTransactionService.getBySavingId(savingId)
                : await savingTransactionService.getAll();
            setTransactions(data);
        } catch (err) {
            setError('Failed to load transactions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Add transaction (deposit/withdraw)
    const addTransaction = async (transaction: Omit<SavingTransaction, 'id'>) => {
        try {
            const newTx = await savingTransactionService.add(transaction);
            setTransactions(prev => [...prev, newTx]);
            return newTx;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add transaction');
            console.error(err);
            throw err;
        }
    };

    // Delete transaction
    const deleteTransaction = async (id: string) => {
        try {
            await savingTransactionService.delete(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            setError('Failed to delete transaction');
            console.error(err);
            throw err;
        }
    };

    // Get filtered transactions
    const getFiltered = (filter: SavingTransactionFilter) => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.type === filter);
    };

    return {
        transactions,
        loading,
        error,
        addTransaction,
        deleteTransaction,
        refresh: loadTransactions,
        getFiltered
    };
}
