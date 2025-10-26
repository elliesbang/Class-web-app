import { Hono } from 'hono'
import { withD1 } from '@hono/d1'

const app = new Hono()

app.get('/', withD1(async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM categories').all()
    return c.json({ success: true, data: results || [] })
  } catch (error) {
    console.error('[api/categories] DB fetch error:', error)
    return c.json({ success: false, message: 'Failed to fetch categories' }, 500)
  }
}))

export default app