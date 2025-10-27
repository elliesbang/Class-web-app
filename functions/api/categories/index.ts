import { Hono } from 'hono'

type Env = { DB: D1Database }

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    const env = c.env
    const result = await env.DB.prepare('SELECT * FROM categories').all()
    const rows = result?.results ?? []

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[categories] Failed to fetch categories', error)
    return Response.json(
      {
        success: false,
        message: '서버 내부 오류',
        error: String(error),
      },
      500,
    )
  }
})

export const onRequest = async (context: any) => app.fetch(context.request, context.env, context)
