import { Transaction, Stats, TransactionFilter, DateFilter } from '../../types/finance.ts';
import { getDb } from './db.ts';

type TxRow = {
    id: string;
    type: 'income' | 'outcome';
    date: string; // ISO
    amount: number;
    category: string;
    description: string | null;
};

function rowToTx(r: TxRow): Transaction {
    return {
        id: r.id,
        type: r.type,
        date: new Date(r.date),
        amount: r.amount,
        category: r.category,
        description: r.description ?? undefined,
    };
}

class TransactionService {
    // Get all transactions
    async getAll(): Promise<Transaction[]> {
        const db = await getDb();
        const rows = await db.select<TxRow[]>(
            "SELECT * FROM transactions ORDER BY date DESC"
        );
        return rows.map(rowToTx);
    }

    // Add new transaction
    async add(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        const db = await getDb();
        const id = crypto.randomUUID();
        const dateIso = (transaction.date instanceof Date ? transaction.date : new Date(transaction.date)).toISOString();

        await db.execute(
            "INSERT INTO transactions (id, type, date, amount, category, description) VALUES ($1,$2,$3,$4,$5,$6)",
            [id, transaction.type, dateIso, transaction.amount, transaction.category, transaction.description ?? null]
        );

        return { ...transaction, id, date: new Date(dateIso) };
    }

    // Delete transaction
    async delete(id: string): Promise<void> {
        const db = await getDb();
        await db.execute("DELETE FROM transactions WHERE id = $1", [id]);
    }

    // Update transaction
    async update(id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<Transaction | null> {
        const db = await getDb();
        const rows = await db.select<TxRow[]>("SELECT * FROM transactions WHERE id = $1", [id]);
        if (!rows.length) return null;

        const current = rowToTx(rows[0]);

        const patched: Transaction = {
            ...current,
            ...updates,
            date: ('date' in updates && updates.date) ? new Date(updates.date as any) : current.date,
            description: ('description' in updates) ? (updates.description ?? undefined) : current.description,
        };

        const dateIso = patched.date.toISOString();

        await db.execute(
            "UPDATE transactions SET type=$1, date=$2, amount=$3, category=$4, description=$5 WHERE id=$6",
            [patched.type, dateIso, patched.amount, patched.category, patched.description ?? null, id]
        );

        return patched;
    }

    // Get transactions by type filter
    async getByType(filter: TransactionFilter): Promise<Transaction[]> {
        if (filter === 'all') return this.getAll();
        const db = await getDb();
        const rows = await db.select<TxRow[]>(
            "SELECT * FROM transactions WHERE type = $1 ORDER BY date DESC",
            [filter]
        );
        return rows.map(rowToTx);
    }

    // Get transactions by date range
    async getByDateRange(start: Date, end: Date): Promise<Transaction[]> {
        const db = await getDb();
        const rows = await db.select<TxRow[]>(
            "SELECT * FROM transactions WHERE date >= $1 AND date <= $2 ORDER BY date DESC",
            [start.toISOString(), end.toISOString()]
        );
        return rows.map(rowToTx);
    }

    // Get transactions by date filter
    async getByDateFilter(filter: DateFilter): Promise<Transaction[]> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        let start: Date;

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
            default:
                return this.getAll();
        }

        return this.getByDateRange(start, end);
    }

    // Get transactions by category
    async getByCategory(category: string): Promise<Transaction[]> {
        const db = await getDb();
        const rows = await db.select<TxRow[]>(
            "SELECT * FROM transactions WHERE category = $1 ORDER BY date DESC",
            [category]
        );
        return rows.map(rowToTx);
    }

    // Calculate stats
    async getStats(): Promise<Stats> {
        const db = await getDb();

        const totals = await db.select<{ totalIncome: number; totalOutcome: number }[]>(
            `SELECT
                 COALESCE(SUM(CASE WHEN type='income' THEN amount END), 0) AS totalIncome,
                 COALESCE(SUM(CASE WHEN type='outcome' THEN amount END), 0) AS totalOutcome
             FROM transactions`
        );

        const { totalIncome, totalOutcome } = totals[0] ?? { totalIncome: 0, totalOutcome: 0 };

        const spendingRows = await db.select<{ category: string; total: number }[]>(
            `SELECT category, COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE type='outcome'
             GROUP BY category`
        );

        const spending: { [category: string]: number } = {};
        spendingRows.forEach(r => (spending[r.category] = r.total));

        const savedRows = await db.select<{ totalSaved: number }[]>(
            "SELECT COALESCE(SUM(balance),0) AS totalSaved FROM savings"
        );
        const totalSaved = savedRows[0]?.totalSaved ?? 0;

        return {
            balance: totalIncome - totalOutcome,
            totalIncome,
            totalOutcome,
            totalSaved,
            spending,
        };
    }

    // Get balance
    async getBalance(): Promise<number> {
        const s = await this.getStats();
        return s.balance;
    }
}

export default new TransactionService();
