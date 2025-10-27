import { Hono } from 'hono'

type Env = { DB: D1Database }

type CategoryRow = { id: number | string | null; name: string | null }

type CategoryResult = { name: string | null }

const app = new Hono<{ Bindings: Env }>()

const normaliseCategoryName = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const fetchRawCategories = async (db: D1Database) => {
  const result = await db.prepare('SELECT * FROM categories').all()
  return result?.results ?? []
}

const fetchCategoriesFromTable = async (db: D1Database) => {
  try {
    const result = await db
      .prepare("SELECT id, name FROM categories WHERE TRIM(name) <> '' ORDER BY name COLLATE NOCASE")
      .all<CategoryRow>()
    const rows = (result?.results ?? []) as CategoryRow[]

    const seen = new Map<string, { id: string; name: string }>()
    for (const row of rows) {
      const name = normaliseCategoryName(row.name)
      if (!name) {
        continue
      }

      const key = name.toLocaleLowerCase('ko')
      if (!seen.has(key)) {
        const rawId = row.id != null ? String(row.id).trim() : ''
        const id = rawId || name
        seen.set(key, { id, name })
      }
    }

    return Array.from(seen.values())
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (/no such table/i.test(message)) {
      return []
    }
    throw error
  }
}

const fetchCategoriesFromClasses = async (db: D1Database) => {
  const result = await db
    .prepare(
      [
        'SELECT DISTINCT TRIM(category) as name',
        'FROM classes',
        "WHERE category IS NOT NULL AND TRIM(category) <> ''",
        'ORDER BY name COLLATE NOCASE',
      ].join(' '),
    )
    .all<CategoryResult>()
  const rows = (result?.results ?? []) as CategoryResult[]

  const seen = new Map<string, { id: string; name: string }>()
  for (const row of rows) {
    const name = normaliseCategoryName(row.name)
    if (!name) {
      continue
    }

    const key = name.toLocaleLowerCase('ko')
    if (!seen.has(key)) {
      seen.set(key, { id: name, name })
    }
  }

  return Array.from(seen.values())
}

app.get('/', async (c) => {
  try {
    const env = c.env
    const source = (c.req.query('source') ?? '').toLocaleLowerCase('en')

    if (source === 'raw') {
      const rows = await fetchRawCategories(env.DB)
      return Response.json({
        success: true,
        count: rows.length,
        data: rows,
      })
    }

    if (source === 'table') {
      const rows = await fetchCategoriesFromTable(env.DB)
      return Response.json({
        success: true,
        count: rows.length,
        data: rows,
      })
    }

    if (source === 'classes') {
      const rows = await fetchCategoriesFromClasses(env.DB)
      return Response.json({
        success: true,
        count: rows.length,
        data: rows,
      })
    }

    const [tableCategories, classCategories] = await Promise.all([
      fetchCategoriesFromTable(env.DB),
      fetchCategoriesFromClasses(env.DB),
    ])

    const merged = new Map<string, { id: string; name: string }>()

    for (const category of [...tableCategories, ...classCategories]) {
      if (!merged.has(category.id)) {
        merged.set(category.id, category)
      }
    }

    const rows = Array.from(merged.values())

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[categories] Failed to fetch categories', error)
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
