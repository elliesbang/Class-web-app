import { Hono } from 'hono'
import { withD1 } from '@hono/d1'
import { z } from 'zod'

interface Env {
  DB: D1Database
}

type PagesContext<Bindings> = {
  request: Request
  env: Bindings
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

type PagesHandler<Bindings> = (context: PagesContext<Bindings>) => Response | Promise<Response>

type AssignmentUploadTime = 'all_day' | 'same_day'

const VALID_WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

type ClassRow = Record<string, unknown>

/* -------------------------- 유틸 함수 섹션 -------------------------- */

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) return trimmed
  }
  return null
}

const toNullableString = (value: unknown): string | null => {
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

const toNullableDate = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

const parseBooleanFlag = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (['1', 'true', 'y', 'yes', 'on'].includes(v)) return true
    if (['0', 'false', 'n', 'no', 'off'].includes(v)) return false
  }
  return fallback
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    const seen = new Set<string>()
    const result: string[] = []
    for (const v of value) {
      const s = String(v).trim()
      if (s && !seen.has(s)) {
        seen.add(s)
        result.push(s)
      }
    }
    return result
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return toStringArray(parsed)
    } catch {}
    return trimmed.split(',').map(v => v.trim()).filter(Boolean)
  }
  return []
}

const parseStoredArray = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return toStringArray(value)
  if (typeof value === 'object') {
    try {
      const parsed = JSON.parse(JSON.stringify(value))
      if (Array.isArray(parsed)) return toStringArray(parsed)
    } catch {}
  }
  return toStringArray(value)
}

const filterValidDays = (input: string[]): string[] => {
  const valid = new Set(VALID_WEEKDAYS)
  const result: string[] = []
  for (const d of input) if (valid.has(d as any) && !result.includes(d)) result.push(d)
  return result
}

const normaliseAssignmentDays = (value: unknown, fallback: string[]): string[] => {
  const parsed = filterValidDays(toStringArray(value))
  return parsed.length > 0 ? parsed : [...fallback]
}

const normaliseDeliveryMethods = (value: unknown, fallback: string[]): string[] => {
  const parsed = toStringArray(value)
  return parsed.length > 0 ? parsed : [...fallback]
}

const normaliseAssignmentUploadTime = (value: unknown, fallback: AssignmentUploadTime): AssignmentUploadTime => {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (['same_day', 'day_only', 'single_day'].includes(v)) return 'same_day'
    if (v === 'all_day') return 'all_day'
  }
  return fallback
}

const getClassTableColumns = async (db: D1Database): Promise<Set<string>> => {
  const { results } = await db.prepare("PRAGMA table_info('classes')").all<{ name: string }>()
  return new Set((results ?? []).map(r => r.name.toLowerCase()))
}

const trySelectWithCategory = async (db: D1Database, columns: Set<string>) => {
  if (!columns.has('category_id')) return null
  try {
    const { results } = await db
      .prepare(
        `SELECT c.*, cat.name AS category_name
         FROM classes c
         LEFT JOIN categories cat ON c.category_id = cat.id
         ORDER BY c.created_at DESC, c.updated_at DESC, c.id DESC`
      )
      .all<ClassRow>()
    return results ?? []
  } catch {
    return null
  }
}

const fetchClassRows = async (db: D1Database, columns: Set<string>) => {
  const joined = await trySelectWithCategory(db, columns)
  if (joined) return joined
  const { results } = await db
    .prepare('SELECT * FROM classes ORDER BY created_at DESC, updated_at DESC, id DESC')
    .all<ClassRow>()
  return results ?? []
}

const resolveCategoryId = async (db: D1Database, name: string | null | undefined) => {
  if (!name) return null
  try {
    const row = await db.prepare('SELECT id FROM categories WHERE name = ? LIMIT 1').bind(name).first<{ id: number }>()
    return row?.id ?? null
  } catch {
    return null
  }
}

/* -------------------------- 라우트 섹션 -------------------------- */

const classPayloadSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  category: z.string().nullable(),
  code: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable()
})

const app = new Hono<{ Bindings: Env }>()

app.use('*', withD1({ binding: 'DB', storeKey: 'DB' }))

// ✅ 모든 수업 조회
app.get('/', async c => {
  try {
    const columns = await getClassTableColumns(c.env.DB)
    const rows = await fetchClassRows(c.env.DB, columns)
    const classes = rows.map(r => {
      const payload = {
        id: Number.isFinite(Number(r.id)) ? Number(r.id) : 0,
        name: toNonEmptyString(r.name) ?? '',
        category: toNullableString(r.category),
        code: toNullableString(r.code),
        startDate: toNullableDate(r.start_date),
        endDate: toNullableDate(r.end_date)
      }

      const parsed = classPayloadSchema.safeParse(payload)
      if (!parsed.success) {
        console.warn('[classes] Failed to validate class payload', parsed.error.issues)
        return {
          id: payload.id,
          name: payload.name,
          category: payload.category ?? null,
          code: payload.code ?? null,
          startDate: payload.startDate ?? null,
          endDate: payload.endDate ?? null
        }
      }

      return parsed.data
    })
    return c.json({ success: true, data: classes })
  } catch (err) {
    return c.json({ success: false, message: String(err) }, 500)
  }
})

export const onRequest: PagesHandler<Env> = context => app.fetch(context.request, context.env, context)

export default app
