// TRANSACTION
export interface Transaction {
    id: string;
    type: 'income' | 'outcome';
    date: Date;
    amount: number;
    category: string;
    description?: string;
}

// STATS
export interface Stats {
    balance: number;
    totalIncome: number;
    totalOutcome: number;
    totalSaved: number;
    spending: { [category: string]: number };
}

// SAVING
export interface Saving {
    id: string;
    name: string;
    target?: number;
    balance: number;
    description?: string;
    createdAt: Date;
}

// SAVING TRANSACTION
export interface SavingTransaction {
    id: string;
    savingID: string;   //--linked to saving id
    amount: number;
    type: 'deposit' | 'withdraw';
    date: Date;
    description?: string;
}


//FILTER TYPES
export type SavingFilter = 'active' | 'completed' | 'all';
export type SavingTransactionFilter = 'deposit' | 'withdraw' | 'all';
export type TransactionFilter = 'income' | 'outcome' | 'all';
export type DateFilter = 'year' | 'month' | 'week' | 'today' | 'all';
