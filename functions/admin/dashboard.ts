import { Hono } from 'hono'

type Env = {
  CLOUDFLARE_API_TOKEN?: string
  DATABASE_ID?: string
  DATABASE_NAME?: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    const env = c.env
    const { CLOUDFLARE_API_TOKEN, DATABASE_ID, DATABASE_NAME, DB } = env

    if (!CLOUDFLARE_API_TOKEN || !DATABASE_ID || !DATABASE_NAME || !DB) {
      return Response.json(
        { success: false, count: 0, data: [], message: '환경변수를 불러오지 못했습니다.' },
        500,
      )
    }

    const result = await DB.prepare('SELECT * FROM classes').all()
    const rows = result?.results ?? []

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[admin-dashboard] Failed to load dashboard data', error)
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
