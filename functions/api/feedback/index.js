const TABLE_CONFIG = {
  videos: {
    schema: `
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'url', 'class_id'],
  },
  materials: {
    schema: `
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'link', 'class_id'],
  },
  notices: {
    schema: `
      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'content', 'class_id'],
  },
  feedback: {
    schema: `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'content', 'class_id'],
  },
};

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

const getTableName = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const table = segments[segments.length - 1];
  if (!table || !TABLE_CONFIG[table]) {
    throw new Error('유효하지 않은 테이블입니다.');
  }
  return table;
};

const ensureTable = async (db, table) => {
  await db.exec(TABLE_CONFIG[table].schema);
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const table = getTableName(url.pathname);
    await ensureTable(DB, table);

    let body = {};
    try {
      body = await context.request.json();
    } catch (parseError) {
      return jsonResponse({ success: false, count: 0, data: [], message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const config = TABLE_CONFIG[table];
    const values = config.columns.map((column) => body[column] ?? null);

    const placeholders = values.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${config.columns.join(', ')}) VALUES (${placeholders})`;
    await DB.prepare(query).bind(...values).run();

    return jsonResponse({ success: true, count: 0, data: [], message: '등록 성공' });
  } catch (error) {
    // console.debug('[feedback] Failed to insert data', error)
    return errorResponse(error);
  }
};

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const table = getTableName(url.pathname);
    await ensureTable(DB, table);

    const classId = url.searchParams.get('class_id');
    const statement = classId
      ? DB.prepare(`SELECT * FROM ${table} WHERE class_id = ?1 ORDER BY created_at DESC`).bind(classId)
      : DB.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`);

    const result = await statement.all();
    const rows = result?.results ?? [];

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[feedback] Failed to fetch data', error)
    return errorResponse(error);
  }
};

export const onRequestDelete = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const table = getTableName(url.pathname);
    await ensureTable(DB, table);

    const id = url.searchParams.get('id');
    if (!id) {
      return jsonResponse({ success: false, count: 0, data: [], message: 'id는 필수 값입니다.' }, 400);
    }

    await DB.prepare(`DELETE FROM ${table} WHERE id = ?1`).bind(id).run();

    return jsonResponse({ success: true, count: 0, data: [], message: '삭제 완료' });
  } catch (error) {
    // console.debug('[feedback] Failed to delete data', error)
    return errorResponse(error);
  }
};
