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
    const { env } = c

    if (!env?.DB) {
      throw new Error('DB 인스턴스가 없습니다.')
    }

    const result = await env.DB.prepare('SELECT * FROM classes').all()
    return c.json(result.results, 200)
  } catch (err) {
    console.error('[GET /classes Error]', err)
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

export const onRequest = withBindings(app.fetch, { DB })

export default app
