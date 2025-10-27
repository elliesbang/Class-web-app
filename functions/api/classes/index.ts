import { Hono } from 'hono'
import { DB, withBindings } from '../hono-utils'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.onError((err, c) => {
  console.error('[Classes API Error]', err)
  const message = err instanceof Error ? err.message : 'Internal Server Error'
  return c.json({ error: message }, 500)
})

app.get('/', async (c) => {
  try {
    const db = c.env.DB
    if (!db) throw new Error('DB 인스턴스가 없습니다.')

    const result = await db.prepare('SELECT * FROM classes').all()
    return c.json({ success: true, data: result.results || [] })
  } catch (err) {
    console.error('[GET /classes Error]', err)
    const message = err instanceof Error ? err.message : '데이터 불러오기 실패'
    return c.json({ error: message }, 500)
  }
})

export const onRequest = withBindings(app.fetch, { DB })

export default app
