import { Hono } from 'hono'

export const app = new Hono()

app.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM class_categories').all()
    return c.json({ success: true, data: result.results || [] })
  } catch (err) {
    console.error('Error fetching categories:', err)
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, message: '카테고리 불러오기 실패', error: message }, 500)
  }
})

export default app
