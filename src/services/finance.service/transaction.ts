import { Transaction, Stats, TransactionFilter, DateFilter } from '../../types/finance.type.ts';

class TransactionService {
    private storageKey = 'persony_transactions';

    // Get all transactions
    async getAll(): Promise<Transaction[]> {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return [];

        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        return parsed.map((t: any) => ({
            ...t,
            date: new Date(t.date)
        }));
    }

    // Add new transaction
    async add(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        const transactions = await this.getAll();
        const newTransaction: Transaction = {
            ...transaction,
            id: Date.now().toString(),
        };
        transactions.push(newTransaction);
        localStorage.setItem(this.storageKey, JSON.stringify(transactions));
        return newTransaction;
    }

    // Delete transaction
    async delete(id: string): Promise<void> {
        const transactions = await this.getAll();
        const filtered = transactions.filter(t => t.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    // Update transaction
    async update(id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<Transaction | null> {
        const transactions = await this.getAll();
        const index = transactions.findIndex(t => t.id === id);

        if (index === -1) return null;

        transactions[index] = { ...transactions[index], ...updates };
        localStorage.setItem(this.storageKey, JSON.stringify(transactions));
        return transactions[index];
    }

    // Get transactions by type filter
    async getByType(filter: TransactionFilter): Promise<Transaction[]> {
        const transactions = await this.getAll();
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.type === filter);
    }

    // Get transactions by date range
    async getByDateRange(start: Date, end: Date): Promise<Transaction[]> {
        const transactions = await this.getAll();
        return transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= start && txDate <= end;
        });
    }

    // Get transactions by date filter
    async getByDateFilter(filter: DateFilter): Promise<Transaction[]> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let start: Date;
        let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        switch (filter) {
            case 'today':
                start = today;
                break;
            case 'week':
                start = new Date(today);
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            case 'all':
                return this.getAll();
            default:
                return this.getAll();
        }

        return this.getByDateRange(start, end);
    }

    // Get transactions by category
    async getByCategory(category: string): Promise<Transaction[]> {
        const transactions = await this.getAll();
        return transactions.filter(t => t.category === category);
    }

    // Calculate stats
    async getStats(): Promise<Stats> {
        const transactions = await this.getAll();

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalOutcome = transactions
            .filter(t => t.type === 'outcome')
            .reduce((sum, t) => sum + t.amount, 0);

        // Spending breakdown by category
        const spending: { [category: string]: number } = {};
        transactions
            .filter(t => t.type === 'outcome')
            .forEach(t => {
                spending[t.category] = (spending[t.category] || 0) + t.amount;
            });

        return {
            balance: totalIncome - totalOutcome,
            totalIncome,
            totalOutcome,
            totalSaved: 0, // Will be calculated from SavingService
            spending
        };
    }

    // Get balance
    async getBalance(): Promise<number> {
        const transactions = await this.getAll();
        return transactions.reduce((balance, t) => {
            return t.type === 'income' ? balance + t.amount : balance - t.amount;
        }, 0);
    }
}

export default new TransactionService();
