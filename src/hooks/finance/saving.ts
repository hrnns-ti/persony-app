import { useState, useEffect } from 'react';
import { Saving, SavingFilter } from '../../types/finance.type';
import savingService from '../../services/finance.service/saving';

export function useSavings() {
    const [savings, setSavings] = useState<Saving[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSavings();
    }, []);

    const loadSavings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await savingService.getAll();
            setSavings(data);
        } catch (err) {
            setError('Failed to load savings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addSaving = async (saving: Omit<Saving, 'id' | 'balance' | 'createdAt'>) => {
        try {
            const newSaving = await savingService.add(saving);
            setSavings(prev => [...prev, newSaving]);
            return newSaving;
        } catch (err) {
            setError('Failed to add saving');
            console.error(err);
            throw err;
        }
    };

    const updateSaving = async (id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>) => {
        try {
            const updated = await savingService.update(id, updates);
            if (updated) {
                setSavings(prev => prev.map(s => s.id === id ? updated : s));
            }
            return updated;
        } catch (err) {
            setError('Failed to update saving');
            console.error(err);
            throw err;
        }
    };

    const deleteSaving = async (id: string) => {
        try {
            await savingService.delete(id);
            setSavings(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            setError('Failed to delete saving');
            console.error(err);
            throw err;
        }
    };

    const getFiltered = (filter: SavingFilter) => {
        if (filter === 'all') return savings;
        if (filter === 'active') return savings.filter(s => !s.target || s.balance < s.target);
        if (filter === 'completed') return savings.filter(s => s.target && s.balance >= s.target);
        return savings;
    };

    const getProgress = (savingId: string): number | null => {
        const saving = savings.find(s => s.id === savingId);
        if (!saving?.target) return null;
        return (saving.balance / saving.target) * 100;
    };

    const getTotalSaved = () => {
        return savings.reduce((sum, s) => sum + s.balance, 0);
    };

    return {
        savings, loading, error,
        addSaving, deleteSaving, updateSaving, // ✅ ALL 3
        refresh: loadSavings, getFiltered, getProgress, getTotalSaved
    };
}
