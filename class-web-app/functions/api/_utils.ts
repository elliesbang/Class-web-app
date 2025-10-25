export type Env = {
  DB: D1Database;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
};

export type ClassRecord = {
  id: number;
  name: string;
};

const ensureColumn = async (db: D1Database, table: string, definition: string) => {
  try {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!/duplicate column name/i.test(message)) {
      throw error;
    }
  }
};

export const ensureBaseSchema = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      class_id INTEGER NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      description TEXT,
      file_name TEXT,
      mime_type TEXT,
      file_size INTEGER,
      class_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT,
      class_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      comment TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT,
      class_id INTEGER NOT NULL,
      file_url TEXT,
      file_name TEXT,
      file_type TEXT NOT NULL DEFAULT 'other',
      link TEXT,
      status TEXT NOT NULL DEFAULT '제출됨',
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );
  `);

  await ensureColumn(db, 'videos', "display_order INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, 'materials', 'file_name TEXT');
  await ensureColumn(db, 'materials', 'mime_type TEXT');
  await ensureColumn(db, 'materials', 'file_size INTEGER');
};

export const fetchClasses = async (db: D1Database): Promise<ClassRecord[]> => {
  await ensureBaseSchema(db);
  const { results } = await db.prepare('SELECT id, name FROM classes ORDER BY id ASC').all<ClassRecord>();
  return results ?? [];
};

export const jsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

export const errorResponse = (message: string, status = 400) =>
  jsonResponse({ error: message }, { status });

export const normaliseDate = (value: unknown) => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
};

export const rowsToCamelCase = <T extends Record<string, unknown>>(rows: T[] | undefined | null) => {
  if (!rows) return [] as T[];

  return rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
      return [camelKey, value];
    });
    return Object.fromEntries(entries) as T;
  });
};
