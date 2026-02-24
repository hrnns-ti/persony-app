import Database from "@tauri-apps/plugin-sql";

const DB_URL = "sqlite:persony.db";

let dbPromise: Promise<Database> | null = null;
let initPromise: Promise<void> | null = null;

async function initCalendarSchema(db: Database): Promise<void> {
    // Foreign keys in SQLite need this
    await db.execute("PRAGMA foreign_keys = ON");

    // CALENDARS
    await db.execute(`
    CREATE TABLE IF NOT EXISTS calendar_calendars (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      color TEXT,
      visibility TEXT NOT NULL DEFAULT 'default'
        CHECK (visibility IN ('default','public','private')),
      is_primary INTEGER NOT NULL DEFAULT 0
        CHECK (is_primary IN (0,1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_calendars_primary ON calendar_calendars(is_primary)`
    );
    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_calendars_title ON calendar_calendars(title)`
    );

    // EVENTS (master / series)
    await db.execute(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      calendar_id TEXT NOT NULL,

      title TEXT NOT NULL,
      description TEXT,
      location TEXT,

      start TEXT NOT NULL,
      end TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0
        CHECK (all_day IN (0,1)),
      timezone TEXT,

      status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed','tentative','cancelled')),
      visibility TEXT NOT NULL DEFAULT 'default'
        CHECK (visibility IN ('default','public','private')),
      transparency TEXT NOT NULL DEFAULT 'opaque'
        CHECK (transparency IN ('opaque','transparent')),

      color TEXT,

      recurrence_json TEXT,  -- JSON RecurrenceRule
      attendees_json TEXT,   -- JSON Attendee[]
      meeting_url TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (calendar_id) REFERENCES calendar_calendars(id) ON DELETE CASCADE
    )
  `);

    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_events_calendar_id ON calendar_events(calendar_id)`
    );
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_cal_events_start ON calendar_events(start)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_cal_events_end ON calendar_events(end)`);
    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_events_status ON calendar_events(status)`
    );

    // EVENT EXCEPTIONS (edit one occurrence / delete one occurrence)
    await db.execute(`
    CREATE TABLE IF NOT EXISTS calendar_event_exceptions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      original_start TEXT NOT NULL,
      cancelled INTEGER NOT NULL DEFAULT 0
        CHECK (cancelled IN (0,1)),
      override_json TEXT, -- JSON Partial override (no recurrence/timestamps)

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
    )
  `);

    await db.execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_cal_exceptions_event_start
     ON calendar_event_exceptions(event_id, original_start)`
    );
    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_exceptions_event_id
     ON calendar_event_exceptions(event_id)`
    );
    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_exceptions_original_start
     ON calendar_event_exceptions(original_start)`
    );

    // REMINDERS (optional but recommended)
    await db.execute(`
    CREATE TABLE IF NOT EXISTS calendar_event_reminders (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      method TEXT NOT NULL CHECK (method IN ('popup','email')),
      minutes_before INTEGER NOT NULL,

      FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
    )
  `);

    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cal_reminders_event_id
     ON calendar_event_reminders(event_id)`
    );
}

export async function getCalendarDb(): Promise<Database> {
    if (!dbPromise) dbPromise = Database.load(DB_URL);
    const db = await dbPromise;

    if (!initPromise) initPromise = initCalendarSchema(db);
    await initPromise;

    return db;
}