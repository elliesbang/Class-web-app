import { Hono } from 'hono'
import { withD1 } from '@hono/d1'
import { z } from 'zod'

type Env = {
  DB: D1Database
}

const addClassSchema = z
  .object({
    classCode: z
      .string({
        required_error: 'classCode is required',
        invalid_type_error: 'classCode must be a string',
      })
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, {
        message: 'classCode cannot be empty',
      }),
    category: z
      .union([z.string(), z.undefined(), z.null()])
      .transform((value) => {
        if (typeof value !== 'string') {
          return undefined
        }

        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }),
  })
  .passthrough()

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

app.post('/add', async (c) => {
  try {
    const parseResult = addClassSchema.safeParse(await c.req.json())

    if (!parseResult.success) {
      return Response.json({ success: false, count: 0, data: [], errors: parseResult.error.flatten() }, 400)
    }

    const body = parseResult.data as Record<string, unknown>
    const db = c.env.DB

    await db
      .prepare(
        'INSERT INTO classes (name, uploadOption, uploadTime, uploadDays, uploadPeriod, classTitle, categoryId) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
      )
      .bind(
        body.name as string,
        body.uploadOption,
        body.uploadTime,
        body.uploadDays,
        body.uploadPeriod,
        body.classTitle,
        body.categoryId,
      )
      .run()

    return Response.json({ success: true, count: 0, data: [], message: '수업이 정상적으로 추가되었습니다.' })
  } catch (error) {
    console.error('❌ 수업 추가 오류:', error)
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
