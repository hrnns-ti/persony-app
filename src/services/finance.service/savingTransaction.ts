import { SavingTransaction, SavingTransactionFilter } from '../../types/finance.ts';
import { getDb } from './db.ts';

type SavingTxRow = {
    id: string;
    saving_id: string;
    amount: number;
    type: 'deposit' | 'withdraw';
    date: string;
    description: string | null;
};

function rowToSavingTx(r: SavingTxRow): SavingTransaction {
    return {
        id: r.id,
        savingID: r.saving_id,
        amount: r.amount,
        type: r.type,
        date: new Date(r.date),
        description: r.description ?? undefined,
    };
}

class SavingTransactionService {
    // Get all saving transactions
    async getAll(): Promise<SavingTransaction[]> {
        const db = await getDb();
        const rows = await db.select<SavingTxRow[]>(
            "SELECT * FROM saving_transactions ORDER BY date DESC"
        );
        return rows.map(rowToSavingTx);
    }

    // Add saving transaction (deposit or withdraw) — ATOMIK
    async add(transaction: Omit<SavingTransaction, 'id'>): Promise<SavingTransaction> {
        const db = await getDb();
        const id = crypto.randomUUID();
        const dateIso = (transaction.date instanceof Date ? transaction.date : new Date(transaction.date)).toISOString();

        await db.execute("BEGIN");
        try {
            const savingRows = await db.select<{ balance: number }[]>(
                "SELECT balance FROM savings WHERE id = $1",
                [transaction.savingID]
            );
            if (!savingRows.length) throw new Error('Saving goal not found');

            const currentBalance = savingRows[0].balance;
            const newBalance =
                transaction.type === 'deposit'
                    ? currentBalance + transaction.amount
                    : currentBalance - transaction.amount;

            if (newBalance < 0) throw new Error('Insufficient balance in saving goal');

            await db.execute(
                `INSERT INTO saving_transactions (id, saving_id, amount, type, date, description)
         VALUES ($1,$2,$3,$4,$5,$6)`,
                [
                    id,
                    transaction.savingID,
                    transaction.amount,
                    transaction.type,
                    dateIso,
                    transaction.description ?? null,
                ]
            );

            await db.execute(
                "UPDATE savings SET balance = $1 WHERE id = $2",
                [newBalance, transaction.savingID]
            );

            await db.execute("COMMIT");

            return { ...transaction, id, date: new Date(dateIso) };
        } catch (e) {
            await db.execute("ROLLBACK");
            throw e;
        }
    }

    // Delete saving transaction — ATOMIK (reverse balance)
    async delete(id: string): Promise<void> {
        const db = await getDb();

        await db.execute("BEGIN");
        try {
            const rows = await db.select<SavingTxRow[]>(
                "SELECT * FROM saving_transactions WHERE id = $1",
                [id]
            );
            if (!rows.length) {
                await db.execute("COMMIT");
                return;
            }

            const tx = rows[0];

            const savingRows = await db.select<{ balance: number }[]>(
                "SELECT balance FROM savings WHERE id = $1",
                [tx.saving_id]
            );
            if (!savingRows.length) throw new Error('Saving goal not found');

            const currentBalance = savingRows[0].balance;
            const reversedBalance =
                tx.type === 'deposit'
                    ? currentBalance - tx.amount
                    : currentBalance + tx.amount;

            if (reversedBalance < 0) throw new Error('Insufficient balance after reversal');

            await db.execute("UPDATE savings SET balance = $1 WHERE id = $2", [reversedBalance, tx.saving_id]);
            await db.execute("DELETE FROM saving_transactions WHERE id = $1", [id]);

            await db.execute("COMMIT");
        } catch (e) {
            await db.execute("ROLLBACK");
            throw e;
        }
    }

    // Get transaction by ID
    async getById(id: string): Promise<SavingTransaction | null> {
        const db = await getDb();
        const rows = await db.select<SavingTxRow[]>(
            "SELECT * FROM saving_transactions WHERE id = $1",
            [id]
        );
        return rows.length ? rowToSavingTx(rows[0]) : null;
    }

    // Get transactions by saving ID
    async getBySavingId(savingID: string): Promise<SavingTransaction[]> {
        const db = await getDb();
        const rows = await db.select<SavingTxRow[]>(
            "SELECT * FROM saving_transactions WHERE saving_id = $1 ORDER BY date DESC",
            [savingID]
        );
        return rows.map(rowToSavingTx);
    }

    // Get transactions by filter
    async getByFilter(filter: SavingTransactionFilter): Promise<SavingTransaction[]> {
        if (filter === 'all') return this.getAll();
        const db = await getDb();
        const rows = await db.select<SavingTxRow[]>(
            "SELECT * FROM saving_transactions WHERE type = $1 ORDER BY date DESC",
            [filter]
        );
        return rows.map(rowToSavingTx);
    }

    // Get transactions by date range
    async getByDateRange(start: Date, end: Date): Promise<SavingTransaction[]> {
        const db = await getDb();
        const rows = await db.select<SavingTxRow[]>(
            "SELECT * FROM saving_transactions WHERE date >= $1 AND date <= $2 ORDER BY date DESC",
            [start.toISOString(), end.toISOString()]
        );
        return rows.map(rowToSavingTx);
    }

    // Get total deposits for a saving
    async getTotalDeposits(savingID: string): Promise<number> {
        const db = await getDb();
        const rows = await db.select<{ total: number }[]>(
            "SELECT COALESCE(SUM(amount),0) AS total FROM saving_transactions WHERE saving_id=$1 AND type='deposit'",
            [savingID]
        );
        return rows[0]?.total ?? 0;
    }

    // Get total withdrawals for a saving
    async getTotalWithdrawals(savingID: string): Promise<number> {
        const db = await getDb();
        const rows = await db.select<{ total: number }[]>(
            "SELECT COALESCE(SUM(amount),0) AS total FROM saving_transactions WHERE saving_id=$1 AND type='withdraw'",
            [savingID]
        );
        return rows[0]?.total ?? 0;
    }
}

export default new SavingTransactionService();
