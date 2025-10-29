// 🔄 Force Cloudflare Functions redeploy - 2024-08-27T00:00:00.000Z
const ensureColumn = async (db, table, definition) => {
  try {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? '');
    if (!/duplicate column name/i.test(message)) {
      throw error;
    }
  }
};

export const ensureBaseSchema = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      category_id INTEGER,
      category TEXT,
      start_date TEXT,
      end_date TEXT,
      assignment_upload_time TEXT,
      assignment_upload_days TEXT,
      upload_limit TEXT,
      upload_day TEXT,
      delivery_methods TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      duration TEXT
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

  await ensureColumn(db, 'classes', 'code TEXT');
  await ensureColumn(db, 'classes', 'category_id INTEGER');
  await ensureColumn(db, 'classes', 'category TEXT');
  await ensureColumn(db, 'classes', 'start_date TEXT');
  await ensureColumn(db, 'classes', 'end_date TEXT');
  await ensureColumn(db, 'classes', 'assignment_upload_time TEXT');
  await ensureColumn(db, 'classes', 'assignment_upload_days TEXT');
  await ensureColumn(db, 'classes', 'upload_limit TEXT');
  await ensureColumn(db, 'classes', 'upload_day TEXT');
  await ensureColumn(db, 'classes', 'delivery_methods TEXT');
  await ensureColumn(db, 'classes', 'is_active INTEGER NOT NULL DEFAULT 1');
  await ensureColumn(db, 'classes', 'description TEXT');
  await ensureColumn(db, 'classes', "created_at TEXT NOT NULL DEFAULT (datetime('now'))");
  await ensureColumn(db, 'classes', "updated_at TEXT NOT NULL DEFAULT (datetime('now'))");
  await ensureColumn(db, 'classes', 'duration TEXT');

  await ensureColumn(db, 'videos', "display_order INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, 'materials', 'file_name TEXT');
  await ensureColumn(db, 'materials', 'mime_type TEXT');
  await ensureColumn(db, 'materials', 'file_size INTEGER');
};

export const initDB = async (env) => {
  const db = env?.DB;
  if (!db) {
    throw new Error('D1 binding "DB" is required to initialise the database.');
  }

  await ensureBaseSchema(db);
  return db;
};

export const fetchClasses = async (db) => {
  await ensureBaseSchema(db);
  const { results } = await db.prepare('SELECT id, name FROM classes ORDER BY id ASC').all();
  return results ?? [];
};

export const normaliseDate = (value) => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
};

export const rowsToCamelCase = (rows) => {
  if (!rows) return [];

  return rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
      return [camelKey, value];
    });
    return Object.fromEntries(entries);
  });
};
