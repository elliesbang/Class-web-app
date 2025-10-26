import { Hono } from 'hono'

type CategoryRow = Record<string, unknown>

const tableExists = async (db: D1Database, tableName: string) => {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1 LIMIT 1")
    .bind(tableName)
    .first<{ name: string }>()

  return Boolean(row?.name)
}

const ensureCategoriesTable = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

const getTableColumns = async (db: D1Database, tableName: string) => {
  const { results } = await db
    .prepare(`PRAGMA table_info('${tableName.replace(/'/g, "''")}')`)
    .all<{ name: string }>()

  const columns = new Set<string>()
  for (const row of results ?? []) {
    if (row && typeof row.name === 'string') {
      columns.add(row.name.toLowerCase())
    }
  }

  return columns
}

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    const stringified = String(value).trim()
    return stringified.length > 0 ? stringified : null
  }

  return null
}

const normaliseCategory = (row: CategoryRow) => {
  const idSource = row.id ?? row.value ?? row.category_id ?? row.categoryId
  const nameSource = row.name ?? row.label ?? row.category_name ?? row.title

  const id = toNonEmptyString(idSource)
  const name = toNonEmptyString(nameSource ?? idSource)

  if (!id || !name) {
    return null
  }

  const displayOrderRaw =
    row.display_order ?? row.displayOrder ?? row.order ?? row.sort_order ?? row.sortOrder
  const displayOrder =
    typeof displayOrderRaw === 'number' && Number.isFinite(displayOrderRaw)
      ? displayOrderRaw
      : (() => {
          const asString = toNonEmptyString(displayOrderRaw)
          if (!asString) {
            return null
          }
          const parsed = Number(asString)
          return Number.isFinite(parsed) ? parsed : null
        })()

  return {
    id,
    name,
    displayOrder:
      typeof displayOrder === 'number' && Number.isFinite(displayOrder) ? displayOrder : null,
  }
}

export const app = new Hono();

app.get('/', async (c) => {
  const db = c.env.DB

  try {
    const hasLegacyTable = await tableExists(db, 'class_categories')

    if (!hasLegacyTable) {
      await ensureCategoriesTable(db)
    }

    const targetTable = hasLegacyTable ? 'class_categories' : 'categories'
    const columns = await getTableColumns(db, targetTable)

    const hasDisplayOrder = columns.has('display_order')
    const hasName = columns.has('name')

    const orderClauseParts: string[] = []
    if (hasDisplayOrder) {
      orderClauseParts.push('COALESCE(display_order, 9999) ASC')
    }
    if (hasName) {
      orderClauseParts.push("COALESCE(name, '') COLLATE NOCASE ASC")
    } else {
      orderClauseParts.push('id ASC')
    }

    const orderClause = orderClauseParts.length > 0 ? ` ORDER BY ${orderClauseParts.join(', ')}` : ''

    const { results } = await db
      .prepare(`SELECT * FROM ${targetTable}${orderClause}`)
      .all<CategoryRow>()

    const payload = (results ?? [])
      .map((row) => normaliseCategory(row))
      .filter((item): item is NonNullable<ReturnType<typeof normaliseCategory>> => item !== null)

    return c.json({
      success: true,
      data: payload,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ success: false, message: '카테고리 불러오기 실패', error: message }, 500)
  }
})

export default app;
