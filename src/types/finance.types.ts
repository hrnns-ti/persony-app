// Transaction
export interface Transaction {
    id: string;
    type: 'income' | 'outcome' | 'saving';
    amount: number;
    category: string;
    date: Date;
    description?: string;
    paymentMethod?: string;              // "Cash", "Card", "Bank Transfer", "E-wallet"
    tags?: string[];                     // ["urgent", "recurring", "business"]
}

// Category
export interface TransactionCategory {
    id: string;
    name: string;                        // "Food", "Transport", "College"
    type: 'income' | 'outcome' | 'both'; // What type of transaction uses this
    color?: string;                      // "#FF6B6B" for charts/UI
    icon?: string;                       // "🍔" or icon name
    budget?: number;                     // Monthly budget limit (optional)
    description?: string;
}

// Saving
export interface SavingAccount {
    id: string;
    name: string;                        // "Emergency Fund", "Vacation Fund"
    balance: number;
    goal?: number;
    color?: string;
}

// Helper
export type TransactionType = 'income' | 'outcome' | 'saving';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'e_wallet';