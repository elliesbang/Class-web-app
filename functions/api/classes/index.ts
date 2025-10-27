import { Hono } from 'hono'
import { withD1 } from '@hono/d1'

type Env = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

// D1 연결 미들웨어
app.use('*', async (c, next) => {
  try {
    const middleware = withD1({ binding: 'DB' })
    await middleware(c, next)
  } catch (error) {
    console.error('[Middleware Error]', error)
    return c.json({ success: false, message: 'DB 연결 실패', error: String(error) }, 500)
  }
})

// 전체 수업 목록 조회
app.get('/', async c => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM classes').all()
    const rows = result?.results ?? []

    // 정상 응답
    return c.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[Classes API Error]', error)
    return c.json({
      success: false,
      message: '서버 내부 오류',
      error: String(error),
    }, 500)
  }
})

// Cloudflare Pages Functions entrypoint
export const onRequest = async (context: any) => {
  return app.fetch(context.request, context.env, context)
}
