import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Saving, SavingFilter } from '../../types/finance.ts';
import savingService from '../../services/finance.service/saving';

type HookError = {
    message: string;
    cause?: unknown;
};

function formatErrorMessage(err: unknown, fallback: string) {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export function useSavings() {
    const [savings, setSavings] = useState<Saving[]>([]);
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

    const loadSavings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await savingService.getAll();
            // DB sudah ORDER BY created_at DESC (dari service), jadi langsung set
            if (mountedRef.current) setSavings(data);
        } catch (err) {
            console.error(err);
            if (mountedRef.current) {
                setError({ message: formatErrorMessage(err, 'Failed to load savings'), cause: err });
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSavings();
    }, [loadSavings]);

    // Add saving
    const addSaving = useCallback(async (saving: Omit<Saving, 'id' | 'balance' | 'createdAt'>) => {
        setError(null);

        const tempId = `temp_${crypto.randomUUID()}`;
        const optimistic: Saving = {
            ...(saving as any),
            id: tempId,
            balance: 0,
            createdAt: new Date(),
        };

        setSavings(prev => [optimistic, ...prev]);

        try {
            const created = await savingService.add(saving);

            setSavings(prev => prev.map(s => (s.id === tempId ? created : s)));

            return created;
        } catch (err) {
            // rollback
            setSavings(prev => prev.filter(s => s.id !== tempId));
            console.error(err);
            setError({ message: formatErrorMessage(err, 'Failed to add saving'), cause: err });
            throw err;
        }
    }, []);

    // Update saving
    const updateSaving = useCallback(
        async (id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>) => {
            setError(null);

            const before = savings;

            const optimistic = before.map(s => {
                if (s.id !== id) return s;
                return {
                    ...s,
                    ...updates,
                    deadline: ('deadline' in updates && updates.deadline)
                        ? new Date(updates.deadline as any)
                        : ('deadline' in updates ? undefined : s.deadline),
                    target: ('target' in updates) ? (updates.target ?? undefined) : s.target,
                    description: ('description' in updates) ? (updates.description ?? undefined) : s.description,
                };
            });

            setSavings(optimistic);

            try {
                const updated = await savingService.update(id, updates);
                if (updated) {
                    setSavings(prev => prev.map(s => (s.id === id ? updated : s)));
                } else {
                    // revert kalau null
                    setSavings(before);
                }
                return updated;
            } catch (err) {
                // rollback
                setSavings(before);
                console.error(err);
                setError({ message: formatErrorMessage(err, 'Failed to update saving'), cause: err });
                throw err;
            }
        },
        [savings]
    );

    // Delete saving — optimistic + rollback
    const deleteSaving = useCallback(async (id: string) => {
        setError(null);

        const before = savings;

        // optimistic remove
        setSavings(prev => prev.filter(s => s.id !== id));

        try {
            await savingService.delete(id);
        } catch (err) {
            // rollback
            setSavings(before);
            console.error(err);
            setError({ message: formatErrorMessage(err, 'Failed to delete saving'), cause: err });
            throw err;
        }
    }, [savings]);

    const getFiltered = useCallback(
        (filter: SavingFilter) => {
            if (filter === 'all') return savings;
            if (filter === 'active') return savings.filter(s => !s.target || s.balance < s.target);
            if (filter === 'completed') return savings.filter(s => !!s.target && s.balance >= s.target);
            return savings;
        },
        [savings]
    );

    const activeSavings = useMemo(
        () => savings.filter(s => !s.target || s.balance < (s.target ?? Infinity)),
        [savings]
    );

    const completedSavings = useMemo(
        () => savings.filter(s => !!s.target && s.balance >= s.target),
        [savings]
    );

    const totalSaved = useMemo(
        () => savings.reduce((sum, s) => sum + (Number.isFinite(s.balance) ? s.balance : 0), 0),
        [savings]
    );

    const getProgress = useCallback(
        (savingId: string): number | null => {
            const saving = savings.find(s => s.id === savingId);
            if (!saving?.target) return null;
            if (saving.target <= 0) return null;
            return (saving.balance / saving.target) * 100;
        },
        [savings]
    );

    return {
        savings,
        activeSavings,
        completedSavings,

        loading,
        error,

        addSaving,
        deleteSaving,
        updateSaving,

        refresh: loadSavings,
        getFiltered,

        getProgress,
        totalSaved,
    };
}