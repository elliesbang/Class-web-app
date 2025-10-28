const ensureColumn = async (db, table, definition) => {
  try {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!/duplicate column name/i.test(message)) {
      throw error;
    }
  }
};

export const ensureBaseSchema = async (db) => {
  // ✅ 기본 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      category TEXT,
      start_date TEXT,
      end_date TEXT,
      assignment_upload_time TEXT,
      assignment_upload_days TEXT,
      delivery_methods TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
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

  // ✅ 안전하게 컬럼 추가 (이미 있으면 건너뜀)
  await ensureColumn(db, 'classes', 'code TEXT');
  await ensureColumn(db, 'classes', 'category TEXT');
  await ensureColumn(db, 'classes', 'start_date TEXT');
  await ensureColumn(db, 'classes', 'end_date TEXT');
  await ensureColumn(db, 'classes', 'assignment_upload_time TEXT');
  await ensureColumn(db, 'classes', 'assignment_upload_days TEXT');
  await ensureColumn(db, 'classes', 'delivery_methods TEXT');
  await ensureColumn(db, 'classes', 'is_active INTEGER NOT NULL DEFAULT 1');
  await ensureColumn(db, 'classes', "created_at TEXT NOT NULL DEFAULT (datetime('now'))");
  await ensureColumn(db, 'classes', "updated_at TEXT NOT NULL DEFAULT (datetime('now'))");
  await ensureColumn(db, 'classes', 'duration TEXT'); // ✅ duration 컬럼 추가

  await ensureColumn(db, 'videos', "display_order INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, 'materials', 'file_name TEXT');
  await ensureColumn(db, 'materials', 'mime_type TEXT');
  await ensureColumn(db, 'materials', 'file_size INTEGER');
};

// ✅ 클래스 목록 불러오기
export const fetchClasses = async (db) => {
  await ensureBaseSchema(db);
  const { results } = await db.prepare('SELECT id, name FROM classes ORDER BY id ASC').all();
  return results ?? [];
};

// ✅ 날짜 포맷 보정
export const normaliseDate = (value) => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
};

// ✅ snake_case → camelCase 변환
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