import Database from "@tauri-apps/plugin-sql";

const DB_URL = "sqlite:persony.db";

let dbPromise: Promise<Database> | null = null;
let initPromise: Promise<void> | null = null;

async function initWorkspaceSchema(db: Database): Promise<void> {
    await db.execute("PRAGMA foreign_keys = ON");

    await db.execute(`
    CREATE TABLE IF NOT EXISTS workspace_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK (status IN ('active','completed','dropped')),
      semester TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      credits INTEGER,
      color TEXT,
      grade TEXT
    )
  `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_courses_status ON workspace_courses(status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_courses_semester ON workspace_courses(semester)`);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS workspace_assignments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      description TEXT,
      assignment_status TEXT NOT NULL CHECK (assignment_status IN ('pending','submitted','graded')),
      type TEXT NOT NULL CHECK (type IN ('exam','practice','assignment')),
      priority TEXT NOT NULL CHECK (priority IN ('low','medium','high')),
      deadline TEXT NOT NULL,
      repo_url TEXT,
      submitted_at TEXT,
      feedback TEXT,
      attachments TEXT,
      FOREIGN KEY (course_id) REFERENCES workspace_courses(id) ON DELETE CASCADE
    )
  `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_assign_course_id ON workspace_assignments(course_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_assign_deadline ON workspace_assignments(deadline)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_assign_status ON workspace_assignments(assignment_status)`);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS workspace_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      course_id TEXT,
      repo_url TEXT,
      deadline TEXT,
      project_status TEXT NOT NULL CHECK (project_status IN ('planning','designing','coding','done','canceled')),
      progress REAL,
      color TEXT NOT NULL,
      tags TEXT,
      FOREIGN KEY (course_id) REFERENCES workspace_courses(id) ON DELETE SET NULL
    )
  `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_proj_course_id ON workspace_projects(course_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_proj_deadline ON workspace_projects(deadline)`);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS workspace_notes (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      course_name TEXT,
      title TEXT NOT NULL,
      tags TEXT NOT NULL,
      content TEXT NOT NULL,
      file_path TEXT,
      is_pinned INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES workspace_courses(id) ON DELETE SET NULL
    )
  `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_notes_course_id ON workspace_notes(course_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_notes_updated_at ON workspace_notes(updated_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_notes_pinned ON workspace_notes(is_pinned)`);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS workspace_certificates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      credential_url TEXT
    )
  `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ws_cert_issue_date ON workspace_certificates(issue_date)`);
}

export async function getWorkspaceDb(): Promise<Database> {
    if (!dbPromise) dbPromise = Database.load(DB_URL);
    const db = await dbPromise;

    if (!initPromise) initPromise = initWorkspaceSchema(db);
    await initPromise;

    return db;
}
