import { Saving, SavingFilter } from '../../types/finance.ts';
import { getDb } from './db.ts';

type SavingRow = {
    id: string;
    name: string;
    target: number | null;
    balance: number;
    description: string | null;
    created_at: string;
    deadline: string | null;
};

function rowToSaving(r: SavingRow): Saving {
    return {
        id: r.id,
        name: r.name,
        target: r.target ?? undefined,
        balance: r.balance,
        description: r.description ?? undefined,
        createdAt: new Date(r.created_at),
        deadline: r.deadline ? new Date(r.deadline) : undefined,
    };
}

class SavingService {
    // Get all savings
    async getAll(): Promise<Saving[]> {
        const db = await getDb();
        const rows = await db.select<SavingRow[]>(
            "SELECT * FROM savings ORDER BY created_at DESC"
        );
        return rows.map(rowToSaving);
    }

    // Add new saving goal
    async add(saving: Omit<Saving, 'id' | 'balance' | 'createdAt'>): Promise<Saving> {
        const db = await getDb();

        const id = crypto.randomUUID();
        const createdAtIso = new Date().toISOString();
        const deadlineIso = saving.deadline ? new Date(saving.deadline as any).toISOString() : null;

        await db.execute(
            `INSERT INTO savings (id, name, target, balance, description, created_at, deadline)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
                id,
                saving.name,
                saving.target ?? null,
                0,
                saving.description ?? null,
                createdAtIso,
                deadlineIso,
            ]
        );

        return {
            ...saving,
            id,
            balance: 0,
            createdAt: new Date(createdAtIso),
            deadline: deadlineIso ? new Date(deadlineIso) : undefined,
        };
    }

    // Get saving by ID
    async getById(id: string): Promise<Saving | null> {
        const db = await getDb();
        const rows = await db.select<SavingRow[]>("SELECT * FROM savings WHERE id = $1", [id]);
        return rows.length ? rowToSaving(rows[0]) : null;
    }

    // Update saving
    async update(id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>): Promise<Saving | null> {
        const db = await getDb();
        const rows = await db.select<SavingRow[]>("SELECT * FROM savings WHERE id = $1", [id]);
        if (!rows.length) return null;

        const current = rowToSaving(rows[0]);

        const patched: Saving = {
            ...current,
            ...updates,
            target: ('target' in updates) ? (updates.target ?? undefined) : current.target,
            description: ('description' in updates) ? (updates.description ?? undefined) : current.description,
            deadline: ('deadline' in updates)
                ? (updates.deadline ? new Date(updates.deadline as any) : undefined)
                : current.deadline,
        };

        await db.execute(
            `UPDATE savings
             SET name=$1, target=$2, balance=$3, description=$4, deadline=$5
             WHERE id=$6`,
            [
                patched.name,
                patched.target ?? null,
                patched.balance,
                patched.description ?? null,
                patched.deadline ? patched.deadline.toISOString() : null,
                id,
            ]
        );

        return patched;
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
        const db = await getDb();
        await db.execute("DELETE FROM savings WHERE id = $1", [id]);
        // saving_transactions akan ikut terhapus karena ON DELETE CASCADE
    }

    // Get savings by filter
    async getByFilter(filter: SavingFilter): Promise<Saving[]> {
        const savings = await this.getAll();

        if (filter === 'all') return savings;

        if (filter === 'active') {
            return savings.filter(s => !s.target || s.balance < s.target);
        }

        if (filter === 'completed') {
            return savings.filter(s => !!s.target && s.balance >= s.target);
        }

        return savings;
    }

    // Get total saved amount across all savings
    async getTotalSaved(): Promise<number> {
        const db = await getDb();
        const rows = await db.select<{ total: number }[]>(
            "SELECT COALESCE(SUM(balance),0) AS total FROM savings"
        );
        return rows[0]?.total ?? 0;
    }

    // Get saving progress (for savings with target)
    async getProgress(id: string): Promise<number | null> {
        const saving = await this.getById(id);
        if (!saving || !saving.target) return null;

        return (saving.balance / saving.target) * 100;
    }
}

export default new SavingService();
