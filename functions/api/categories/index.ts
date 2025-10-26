import { Hono } from 'hono'
import { withD1 } from '@hono/d1'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.use('*', async (c, next) => {
  try {
    await withD1()(c, next)
  } catch (err) {
    console.error('[D1 Middleware Error]', err)
    return c.json({ success: false, message: 'D1 연결 실패', error: String(err) }, 500)
  }
})

app.get('/', async (c) => {
  try {
    const db = c.env.DB
    if (!db) throw new Error('DB 인스턴스가 없습니다.')

    const result = await db.prepare('SELECT * FROM categories').all()
    return c.json({ success: true, data: result.results || [] })
  } catch (err) {
    console.error('[GET /categories Error]', err)
    return c.json({ success: false, message: '데이터 불러오기 실패', error: String(err) }, 500)
  }
})

export const onRequest = app.fetch
