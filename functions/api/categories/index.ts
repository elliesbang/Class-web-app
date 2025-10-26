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

type CategoryRow = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

const categoryRowSchema = z
  .object({
    id: z.coerce.number().int().nonnegative(),
    name: z.string(),
    created_at: z.string(),
    updated_at: z.string()
  })
  .passthrough()

const categoryPayloadSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

const categoryRequestSchema = z.object({
  name: z
    .string({ required_error: '카테고리 이름은 필수입니다.' })
    .trim()
    .min(1, '카테고리 이름은 필수입니다.')
})

const normaliseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error occurred'
  }
}

const toCategoryPayload = (row: CategoryRow) => {
  const parsed = categoryRowSchema.safeParse(row)
  const data = parsed.success ? parsed.data : { ...row, id: row.id ?? 0 }

  const payload = {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }

  const payloadResult = categoryPayloadSchema.safeParse(payload)
  if (!payloadResult.success) {
    console.warn('[categories] Invalid category payload', payloadResult.error.issues)
    return {
      id: Number.isFinite(Number(row.id)) ? Number(row.id) : 0,
      name: row.name ?? '',
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? new Date().toISOString()
    }
  }

  return payloadResult.data
}

const parseCategoryRequest = async (request: Request) => {
  try {
    const json = await request.json()
    const result = categoryRequestSchema.safeParse(json)
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '유효한 요청 본문이 필요합니다.'
      return { error: message, status: 400 as const }
    }
    return { data: result.data, status: 200 as const }
  } catch {
    return { error: '유효한 JSON 형식의 요청 본문을 전달해주세요.', status: 400 as const }
  }
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', withD1({ binding: 'DB', storeKey: 'DB' }))

app.get('/', async c => {
  try {
    const { results } = await c.env.DB
      .prepare('SELECT id, name, created_at, updated_at FROM categories ORDER BY id ASC')
      .all<CategoryRow>()

    const categories = (results ?? []).map(toCategoryPayload)

    return c.json({ success: true, data: categories })
  } catch (error) {
    return c.json({ success: false, message: normaliseErrorMessage(error) }, 500)
  }
})

app.post('/', async c => {
  const result = await parseCategoryRequest(c.req.raw)

  if ('error' in result) {
    return c.json({ success: false, message: result.error }, result.status)
  }

  const { name } = result.data
  const now = new Date().toISOString()

  try {
    const insertResult = await c.env.DB
      .prepare('INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)')
      .bind(name, now, now)
      .run()

    const insertedId = insertResult.meta.last_row_id

    if (!insertedId) {
      return c.json({ success: false, message: '카테고리 저장 결과를 확인할 수 없습니다.' }, 500)
    }

    const inserted = await c.env.DB
      .prepare('SELECT id, name, created_at, updated_at FROM categories WHERE id = ? LIMIT 1')
      .bind(insertedId)
      .first<CategoryRow>()

    if (!inserted) {
      return c.json({ success: false, message: '저장된 카테고리를 찾을 수 없습니다.' }, 500)
    }

    return c.json({ success: true, data: toCategoryPayload(inserted) }, 201)
  } catch (error) {
    return c.json({ success: false, message: normaliseErrorMessage(error) }, 500)
  }
})

app.delete('/:id', async c => {
  const idParam = c.req.param('id')
  const id = Number(idParam)

  if (!idParam || Number.isNaN(id)) {
    return c.json({ success: false, message: '삭제할 카테고리 ID가 올바르지 않습니다.' }, 400)
  }

  try {
    const deleteResult = await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()

    if (deleteResult.meta.changes === 0) {
      return c.json({ success: false, message: '삭제할 카테고리를 찾을 수 없습니다.' }, 404)
    }

    return c.json({ success: true, message: '카테고리가 삭제되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: normaliseErrorMessage(error) }, 500)
  }
})

export const onRequest: PagesHandler<Env> = context => app.fetch(context.request, context.env, context)

export default app
