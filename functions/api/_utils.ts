export type Env = {
  DB: D1Database;
};

export type ClassRecord = {
  id: number;
  name: string;
};

const BASE_CLASSES: ReadonlyArray<ClassRecord> = [
  { id: 1, name: '미치나' },
  { id: 2, name: '이얼챌' },
  { id: 3, name: '캔디마' },
  { id: 4, name: '나캔디' },
  { id: 5, name: '캔디수' },
  { id: 6, name: '나컬작' },
  { id: 7, name: '에그작' },
  { id: 8, name: '나컬작챌' },
  { id: 9, name: '에그작챌' },
  { id: 10, name: '미템나' },
];

export const ensureBaseSchema = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      class_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      description TEXT,
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
};

export const seedBaseClasses = async (db: D1Database) => {
  const statements = BASE_CLASSES.map(({ id, name }) =>
    db.prepare('INSERT OR IGNORE INTO classes (id, name) VALUES (?1, ?2)').bind(id, name),
  );

  if (statements.length > 0) {
    await db.batch(statements);
  }
};

export const fetchClasses = async (db: D1Database): Promise<ClassRecord[]> => {
  await ensureBaseSchema(db);
  await seedBaseClasses(db);
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
