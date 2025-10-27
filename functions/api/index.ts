import { Hono } from 'hono'

import { DB, withBindings } from './hono-utils'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.onError((err, c) => {
  console.error('[API Root Error]', err)
  const message = err instanceof Error ? err.message : 'Internal Server Error'
  return c.json({ error: message }, 500)
})

app.get('/', async (c) => {
  const db = c.env.DB
  if (!db) {
    throw new Error('D1 데이터베이스 바인딩(DB)이 설정되지 않았습니다.')
  }

  const { results } = await db.prepare('SELECT name FROM sqlite_master WHERE type = ?1 LIMIT 5').bind('table').all()
  return c.json({ success: true, tables: results ?? [] })
})

export const onRequest = withBindings(app.fetch, { DB })

export default app
