import { Hono } from 'hono'
import { withD1 } from '@hono/d1'

type Env = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', async (c, next) => {
  try {
    const middleware = withD1({ binding: 'DB' })
    await middleware(c, next)
  } catch (error) {
    console.error('[Middleware Error]', error)
    return Response.json({ success: false, count: 0, data: [], message: 'DB 연결 실패', error: String(error) }, 500)
  }
})

app.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM classes').all()
    const rows = result?.results ?? []

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[Classes API Error]', error)
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
