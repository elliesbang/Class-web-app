import { Hono } from 'hono'
import { withD1 } from '@hono/d1'
import { jsonResponse, jsonError } from '../_utils'

const app = new Hono()

app.get('/', withD1(async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM classes').all()
    return jsonResponse(true, results ?? [])
  } catch (error) {
    return jsonError(error, 'Failed to fetch classes')
  }
}))

export default app
