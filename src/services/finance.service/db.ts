import Database from "@tauri-apps/plugin-sql";

const DB_URL = "sqlite:persony.db";

let dbPromise: Promise<Database> | null = null;
let initPromise: Promise<void> | null = null;

async function initSchema(db: Database): Promise<void> {
    await db.execute("PRAGMA foreign_keys = ON");

    // transactions
    await db.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK (type IN ('income','outcome')),
            date TEXT NOT NULL,
            amount REAL NOT NULL CHECK (amount >= 0),
            category TEXT NOT NULL,
            description TEXT
        )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`);

    // savings
    await db.execute(`
        CREATE TABLE IF NOT EXISTS savings (
           id TEXT PRIMARY KEY,
           name TEXT NOT NULL,
           target REAL,
           balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0),
           description TEXT,
           created_at TEXT NOT NULL,
           deadline TEXT
        )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_savings_created_at ON savings(created_at)`);

    // saving_transactions
    await db.execute(`
        CREATE TABLE IF NOT EXISTS saving_transactions (
           id TEXT PRIMARY KEY,
           saving_id TEXT NOT NULL,
           amount REAL NOT NULL CHECK (amount >= 0),
           type TEXT NOT NULL CHECK (type IN ('deposit','withdraw')),
           date TEXT NOT NULL,
           description TEXT,
           FOREIGN KEY (saving_id) REFERENCES savings(id) ON DELETE CASCADE
        )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_saving_tx_saving_id ON saving_transactions(saving_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_saving_tx_date ON saving_transactions(date)`);
}

export async function getDb(): Promise<Database> {
    if (!dbPromise) dbPromise = Database.load(DB_URL);
    const db = await dbPromise;

    if (!initPromise) initPromise = initSchema(db);
    await initPromise;

    return db;
}
