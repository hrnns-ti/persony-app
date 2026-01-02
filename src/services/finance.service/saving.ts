import { Saving, SavingFilter } from '../../types/finance.type';

class SavingService {
    private storageKey = 'persony_savings';

    // Get all savings
    async getAll(): Promise<Saving[]> {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return [];

        const parsed = JSON.parse(data);
        return parsed.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            deadline: s.deadline ? new Date(s.deadline) : undefined
        }));
    }

    // Add new saving goal
    async add(saving: Omit<Saving, 'id' | 'balance' | 'createdAt'>): Promise<Saving> {
        const savings = await this.getAll();
        const newSaving: Saving = {
            ...saving,
            id: Date.now().toString(),
            balance: 0, // Start with 0 balance
            createdAt: new Date(),
        };
        savings.push(newSaving);
        localStorage.setItem(this.storageKey, JSON.stringify(savings));
        return newSaving;
    }

    // Get saving by ID
    async getById(id: string): Promise<Saving | null> {
        const savings = await this.getAll();
        return savings.find(s => s.id === id) || null;
    }

    // Update saving
    async update(id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>): Promise<Saving | null> {
        const savings = await this.getAll();
        const index = savings.findIndex(s => s.id === id);

        if (index === -1) return null;

        savings[index] = { ...savings[index], ...updates };
        localStorage.setItem(this.storageKey, JSON.stringify(savings));
        return savings[index];
    }

    // Update saving balance (internal method, called by SavingTransactionService)
    async updateBalance(id: string, amount: number, type: 'deposit' | 'withdraw'): Promise<Saving | null> {
        const saving = await this.getById(id);
        if (!saving) return null;

        const newBalance = type === 'deposit'
            ? saving.balance + amount
            : saving.balance - amount;

        if (newBalance < 0) {
            throw new Error('Insufficient balance in saving');
        }

        return this.update(id, { balance: newBalance });
    }

    // Delete saving
    async delete(id: string): Promise<void> {
        const savings = await this.getAll();
        const filtered = savings.filter(s => s.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    // Get savings by filter
    async getByFilter(filter: SavingFilter): Promise<Saving[]> {
        const savings = await this.getAll();

        if (filter === 'all') return savings;

        if (filter === 'active') {
            return savings.filter(s => {
                // No target = always active
                if (!s.target) return true;
                // Has target = check if not completed
                return s.balance < s.target;
            });
        }

        if (filter === 'completed') {
            return savings.filter(s => {
                // No target = never completed
                if (!s.target) return false;
                // Has target = check if completed
                return s.balance >= s.target;
            });
        }

        return savings;
    }

    // Get total saved amount across all savings
    async getTotalSaved(): Promise<number> {
        const savings = await this.getAll();
        return savings.reduce((sum, s) => sum + s.balance, 0);
    }

    // Get saving progress (for savings with target)
    async getProgress(id: string): Promise<number | null> {
        const saving = await this.getById(id);
        if (!saving || !saving.target) return null;

        return (saving.balance / saving.target) * 100;
    }
}

export default new SavingService();