import { Transaction } from "../types";

const STORAGE_KEY = 'persony-app-oleh-haerunnas';

class TransactionService {
    private readRaw(): Transaction[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return parsed.map(t => ({
                ...t,
                date: new Date(t.date),
            }));
        } catch {
            return [];
        }
    }

    private writeRaw(items: Transaction[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Transaction[]> {
        return this.readRaw();
    }

    async add(data: Omit<Transaction, "id">): Promise<Transaction> {
        const all = this.readRaw();
        const tx: Transaction = {
            ...data,
            id: crypto.randomUUID()
        };
        all.push(tx);
        this.writeRaw(all);
        return tx;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        const filtered = all.filter(t => t.id === id);
        this.writeRaw(filtered);
    }

    async clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }
}


const transactionService = new TransactionService();
export default transactionService;