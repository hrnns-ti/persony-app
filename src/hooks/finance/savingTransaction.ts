import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SavingTransaction, SavingTransactionFilter } from '../../types/finance.ts';
import savingTransactionService from '../../services/finance.service/savingTransaction';

type HookError = {
    message: string;
    cause?: unknown;
};

function formatErrorMessage(err: unknown, fallback: string) {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export function useSavingTransactions(savingId?: string) {
    const [transactions, setTransactions] = useState<SavingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<HookError | null>(null);

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

            const data = savingId
                ? await savingTransactionService.getBySavingId(savingId)
                : await savingTransactionService.getAll();

            // DB sudah ORDER BY date DESC, jadi langsung set
            if (mountedRef.current) setTransactions(data);
        } catch (err) {
            console.error(err);
            if (mountedRef.current) {
                setError({ message: formatErrorMessage(err, 'Failed to load transactions'), cause: err });
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [savingId]);

    useEffect(() => {
        void loadTransactions();
    }, [loadTransactions]);

    // Add transaction (deposit/withdraw) — optimistic + rollback
    const addTransaction = useCallback(async (transaction: Omit<SavingTransaction, 'id'>) => {
        setError(null);

        const tempId = `temp_${crypto.randomUUID()}`;
        const optimistic: SavingTransaction = {
            ...transaction,
            id: tempId,
            date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
        };

        setTransactions(prev => [optimistic, ...prev]);

        try {
            const created = await savingTransactionService.add(transaction);

            setTransactions(prev => prev.map(t => (t.id === tempId ? created : t)));

            return created;
        } catch (err) {
            // rollback optimistic insert
            setTransactions(prev => prev.filter(t => t.id !== tempId));
            console.error(err);
            setError({ message: formatErrorMessage(err, 'Failed to add transaction'), cause: err });
            throw err;
        }
    }, []);

    // Delete transaction — optimistic + rollback
    const deleteTransaction = useCallback(async (id: string) => {
        setError(null);

        // rollback snapshot
        const before = transactions;

        // optimistic remove
        setTransactions(prev => prev.filter(t => t.id !== id));

        try {
            await savingTransactionService.delete(id);
        } catch (err) {
            // rollback
            setTransactions(before);
            console.error(err);
            setError({ message: formatErrorMessage(err, 'Failed to delete transaction'), cause: err });
            throw err;
        }
    }, [transactions]);

    const getFiltered = useCallback(
        (filter: SavingTransactionFilter) => {
            if (filter === 'all') return transactions;
            return transactions.filter(t => t.type === filter);
        },
        [transactions]
    );

    const deposits = useMemo(() => transactions.filter(t => t.type === 'deposit'), [transactions]);
    const withdrawals = useMemo(() => transactions.filter(t => t.type === 'withdraw'), [transactions]);

    return {
        transactions,
        deposits,
        withdrawals,

        loading,
        error,

        addTransaction,
        deleteTransaction,

        refresh: loadTransactions,
        getFiltered,
    };
}
