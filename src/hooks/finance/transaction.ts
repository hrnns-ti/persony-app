import { useState, useEffect } from 'react';
import { Transaction, TransactionFilter, DateFilter } from '../../types/finance.ts';
import transactionService from '../../services/finance.service/transaction';

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load all transactions on mount
    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await transactionService.getAll();
            setTransactions(data);
        } catch (err) {
            setError('Failed to load transactions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Add new transaction
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const newTx = await transactionService.add(transaction);
            setTransactions(prev => [...prev, newTx]);
            return newTx;
        } catch (err) {
            setError('Failed to add transaction');
            console.error(err);
            throw err;
        }
    };

    // Delete transaction
    const deleteTransaction = async (id: string) => {
        try {
            await transactionService.delete(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            setError('Failed to delete transaction');
            console.error(err);
            throw err;
        }
    };

    // Update transaction
    const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
        try {
            const updated = await transactionService.update(id, updates);
            if (updated) {
                setTransactions(prev => prev.map(t => t.id === id ? updated : t));
            }
            return updated;
        } catch (err) {
            setError('Failed to update transaction');
            console.error(err);
            throw err;
        }
    };

    // Get filtered transactions
    const getFiltered = (typeFilter: TransactionFilter, dateFilter: DateFilter) => {
        let filtered = transactions;

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Apply date filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateFilter) {
            case 'today':
                filtered = filtered.filter(t => {
                    const txDate = new Date(t.date);
                    return txDate >= today;
                });
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                filtered = filtered.filter(t => new Date(t.date) >= monthStart);
                break;
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                filtered = filtered.filter(t => new Date(t.date) >= yearStart);
                break;
            case 'all':
            default:
                // No date filter
                break;
        }

        return filtered;
    };

    // Get stats
    const getStats = async () => {
        try {
            return await transactionService.getStats();
        } catch (err) {
            console.error('Failed to get stats', err);
            return null;
        }
    };

    return {
        transactions,
        loading,
        error,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        refresh: loadTransactions,
        getFiltered,
        getStats
    };
}
