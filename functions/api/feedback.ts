import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

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
    columns: ['title', 'url', 'class_id'] as const,
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
    columns: ['title', 'link', 'class_id'] as const,
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
    columns: ['title', 'content', 'class_id'] as const,
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
    columns: ['title', 'content', 'class_id'] as const,
  },
}

const app = new Hono<{ Bindings: Env }>()

type TableName = keyof typeof TABLE_CONFIG

const getTableName = (path: string): TableName => {
  const [, , table] = path.split('/')
  if (!table || !(table in TABLE_CONFIG)) {
    throw new Error('유효하지 않은 테이블입니다.')
  }
  return table as TableName
}

const ensureTable = async (db: D1Database, table: TableName) => {
  await db.exec(TABLE_CONFIG[table].schema)
}

app.post('/', async (c) => {
  try {
    const env = c.env
    const table = getTableName(c.req.path)
    await ensureTable(env.DB, table)

    const body = await c.req.json<Record<string, unknown>>()
    const config = TABLE_CONFIG[table]
    const values = config.columns.map((column) => body[column])

    const placeholders = values.map(() => '?').join(', ')
    const query = `INSERT INTO ${table} (${config.columns.join(', ')}) VALUES (${placeholders})`
    await env.DB.prepare(query).bind(...values).run()

    return Response.json({ success: true, count: 0, data: [], message: '등록 성공' })
  } catch (error) {
    console.error('[feedback] Failed to insert data', error)
    return Response.json(
      {
        success: false,
        message: '서버 내부 오류',
        error: String(error),
      },
      500,
    )
  }
})

app.get('/', async (c) => {
  try {
    const env = c.env
    const table = getTableName(c.req.path)
    await ensureTable(env.DB, table)

    const classId = c.req.query('class_id')
    const statement = classId
      ? env.DB.prepare(`SELECT * FROM ${table} WHERE class_id = ?1 ORDER BY created_at DESC`).bind(classId)
      : env.DB.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`)

    const result = await statement.all<Record<string, unknown>>()
    const rows = result?.results ?? []

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[feedback] Failed to fetch data', error)
    return Response.json(
      {
        success: false,
        message: '서버 내부 오류',
        error: String(error),
      },
      500,
    )
  }
})

app.delete('/', async (c) => {
  try {
    const env = c.env
    const table = getTableName(c.req.path)
    await ensureTable(env.DB, table)

    const id = c.req.query('id')
    if (!id) {
      return Response.json({ success: false, count: 0, data: [], message: 'id는 필수 값입니다.' }, 400)
    }

    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?1`).bind(id).run()

    return Response.json({ success: true, count: 0, data: [], message: '삭제 완료' })
  } catch (error) {
    console.error('[feedback] Failed to delete data', error)
    return Response.json(
      {
        success: false,
        message: '서버 내부 오류',
        error: String(error),
      },
      500,
    )
  }
})

export const onRequest = async (context: any) => app.fetch(context.request, context.env, context)
