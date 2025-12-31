import { SavingTransaction, SavingTransactionFilter } from '../../types/finance.type';
import savingService from './saving';

class SavingTransactionService {
    private storageKey = 'persony_saving_transactions';

    // Get all saving transactions
    async getAll(): Promise<SavingTransaction[]> {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return [];

        const parsed = JSON.parse(data);
        return parsed.map((st: any) => ({
            ...st,
            date: new Date(st.date)
        }));
    }

    // Add saving transaction (deposit or withdraw)
    async add(transaction: Omit<SavingTransaction, 'id'>): Promise<SavingTransaction> {
        // Validate saving exists
        const saving = await savingService.getById(transaction.savingID);
        if (!saving) {
            throw new Error('Saving goal not found');
        }

        // Validate withdraw amount
        if (transaction.type === 'withdraw' && transaction.amount > saving.balance) {
            throw new Error('Insufficient balance in saving goal');
        }

        // Create transaction
        const transactions = await this.getAll();
        const newTransaction: SavingTransaction = {
            ...transaction,
            id: Date.now().toString(),
        };
        transactions.push(newTransaction);
        localStorage.setItem(this.storageKey, JSON.stringify(transactions));

        // Update saving balance
        await savingService.updateBalance(
            transaction.savingID,
            transaction.amount,
            transaction.type
        );

        return newTransaction;
    }

    // Delete saving transaction
    async delete(id: string): Promise<void> {
        // Get transaction to reverse balance change
        const transaction = await this.getById(id);
        if (!transaction) return;

        // Reverse the balance change
        const reverseType = transaction.type === 'deposit' ? 'withdraw' : 'deposit';
        await savingService.updateBalance(
            transaction.savingID,
            transaction.amount,
            reverseType
        );

        // Delete transaction
        const transactions = await this.getAll();
        const filtered = transactions.filter(st => st.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    // Get transaction by ID
    async getById(id: string): Promise<SavingTransaction | null> {
        const transactions = await this.getAll();
        return transactions.find(st => st.id === id) || null;
    }

    // Get transactions by saving ID
    async getBySavingId(savingID: string): Promise<SavingTransaction[]> {
        const transactions = await this.getAll();
        return transactions.filter(st => st.savingID === savingID);
    }

    // Get transactions by filter
    async getByFilter(filter: SavingTransactionFilter): Promise<SavingTransaction[]> {
        const transactions = await this.getAll();
        if (filter === 'all') return transactions;
        return transactions.filter(st => st.type === filter);
    }

    // Get transactions by date range
    async getByDateRange(start: Date, end: Date): Promise<SavingTransaction[]> {
        const transactions = await this.getAll();
        return transactions.filter(st => {
            const txDate = new Date(st.date);
            return txDate >= start && txDate <= end;
        });
    }

    // Get total deposits for a saving
    async getTotalDeposits(savingID: string): Promise<number> {
        const transactions = await this.getBySavingId(savingID);
        return transactions
            .filter(st => st.type === 'deposit')
            .reduce((sum, st) => sum + st.amount, 0);
    }

    // Get total withdrawals for a saving
    async getTotalWithdrawals(savingID: string): Promise<number> {
        const transactions = await this.getBySavingId(savingID);
        return transactions
            .filter(st => st.type === 'withdraw')
            .reduce((sum, st) => sum + st.amount, 0);
    }
}

export default new SavingTransactionService();
