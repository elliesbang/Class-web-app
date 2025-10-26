import { Hono } from 'hono'
import { withD1 } from '@hono/d1'

const app = new Hono()

app.get('/', withD1(async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM classes').all()
    return c.json({ success: true, data: results || [] })
  } catch (error) {
    console.error('[api/classes] DB fetch error:', error)
    return c.json({ success: false, message: 'Failed to fetch classes' }, 500)
  }
}))

export default app
