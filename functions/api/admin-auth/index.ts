import { Hono } from 'hono'

type Env = { DB: D1Database; ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string }

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  try {
    const env = c.env
    const adminEmail = env.ADMIN_EMAIL?.trim()
    const adminPassword = env.ADMIN_PASSWORD?.trim()

    if (!adminEmail || !adminPassword) {
      return Response.json({ success: false, count: 0, data: [], message: '관리자 인증 정보가 설정되지 않았습니다.' }, 500)
    }

    let payload: { email?: string; password?: string }
    try {
      payload = (await c.req.json()) as { email?: string; password?: string }
    } catch (error) {
      return Response.json({ success: false, count: 0, data: [], message: '올바른 JSON 형식의 요청이 필요합니다.' }, 400)
    }

    const email = payload.email?.trim()
    const password = payload.password?.trim()

    if (!email || !password) {
      return Response.json({ success: false, count: 0, data: [], message: '이메일과 비밀번호를 모두 입력하세요.' }, 400)
    }

    if (email !== adminEmail || password !== adminPassword) {
      return Response.json({ success: false, count: 0, data: [], message: '비밀번호 불일치 또는 등록되지 않은 관리자' }, 401)
    }

    const rows = [{ name: '관리자', email: adminEmail }]

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[admin-auth] Failed to authenticate admin', error)
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
