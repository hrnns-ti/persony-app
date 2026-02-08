import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Transaction, TransactionFilter, DateFilter, Stats } from '../../types/finance.ts';
import transactionService from '../../services/finance.service/transaction';

type HookError = {
    message: string;
    cause?: unknown;
};

function formatErrorMessage(err: unknown, fallback: string) {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<HookError | null>(null);

    const [stats, setStats] = useState<Stats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Avoid state update after unmount
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await transactionService.getAll();

            if (mountedRef.current) setTransactions(data);
        } catch (err) {
            console.error(err);
            if (mountedRef.current) {
                setError({ message: formatErrorMessage(err, 'Failed to load transactions'), cause: err });
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTransactions();
    }, [loadTransactions]);

    // Add new transaction (optimistic + rollback)
    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
        setError(null);

        // optimistic item (id sementara)
        const tempId = `temp_${crypto.randomUUID()}`;
        const optimistic: Transaction = {
            ...transaction,
            id: tempId,
            date: true ? transaction.date : new Date(transaction.date),
        };

        setTransactions(prev => [optimistic, ...prev]);

        try {
            const created = await transactionService.add(transaction);

            setTransactions(prev =>
                prev.map(t => (t.id === tempId ? created : t))
            );

            return created;
        } catch (err) {
            // rollback optimistic insert
            setTransactions(prev => prev.filter(t => t.id !== tempId));
            console.error(err);
            setError({ message: formatErrorMessage(err, 'Failed to add transaction'), cause: err });
            throw err;
        }
    }, []);

    // Delete transaction
    const deleteTransaction = useCallback(async (id: string) => {
        setError(null);

        const before = transactions;
        // optimistic remove
        setTransactions(prev => prev.filter(t => t.id !== id));

        try {
            await transactionService.delete(id);
        } catch (err) {
            // rollback
            setTransactions(before);
            console.error(err);
            setError({ message: formatErrorMessage(err, 'Failed to delete transaction'), cause: err });
            throw err;
        }
    }, [transactions]);

    // Update transaction
    const updateTransaction = useCallback(
        async (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
            setError(null);

            const before = transactions;
            const optimistic = before.map(t => {
                if (t.id !== id) return t;
                return {
                    ...t,
                    ...updates,
                    date: updates.date ? new Date(updates.date as any) : t.date,
                };
            });

            setTransactions(optimistic);

            try {
                const updated = await transactionService.update(id, updates);
                if (updated) {
                    setTransactions(prev => prev.map(t => (t.id === id ? updated : t)));
                } else {
                    setTransactions(before);
                }
                return updated;
            } catch (err) {
                // rollback
                setTransactions(before);
                console.error(err);
                setError({ message: formatErrorMessage(err, 'Failed to update transaction'), cause: err });
                throw err;
            }
        },
        [transactions]
    );

    const getFiltered = useCallback(
        (typeFilter: TransactionFilter, dateFilter: DateFilter) => {
            let filtered = transactions;

            // Type filter
            if (typeFilter !== 'all') {
                filtered = filtered.filter(t => t.type === typeFilter);
            }

            // Date filter
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            switch (dateFilter) {
                case 'today': {
                    filtered = filtered.filter(t => new Date(t.date) >= today);
                    break;
                }
                case 'week': {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
                    break;
                }
                case 'month': {
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    filtered = filtered.filter(t => new Date(t.date) >= monthStart);
                    break;
                }
                case 'year': {
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    filtered = filtered.filter(t => new Date(t.date) >= yearStart);
                    break;
                }
                case 'all':
                default:
                    break;
            }

            return filtered;
        },
        [transactions]
    );

    const refreshStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            setError(null);
            const s = await transactionService.getStats();
            if (mountedRef.current) setStats(s);
            return s;
        } catch (err) {
            console.error('Failed to get stats', err);
            if (mountedRef.current) {
                setError({ message: formatErrorMessage(err, 'Failed to get stats'), cause: err });
            }
            return null;
        } finally {
            if (mountedRef.current) setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loading) void refreshStats();
    }, [transactions.length, loading, refreshStats]);

    const latestTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

    return {
        transactions,
        latestTransactions,

        loading,
        error,

        addTransaction,
        deleteTransaction,
        updateTransaction,

        refresh: loadTransactions,

        getFiltered,

        stats,
        statsLoading,
        refreshStats,
    };
}
