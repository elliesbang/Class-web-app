import { Hono } from 'hono'

import { ensureBaseSchema, normaliseDate } from './_utils'

type Env = { DB: D1Database }

type NoticeRow = {
  id: number
  title: string
  content: string
  author: string | null
  class_id: number
  created_at: string
}

const toNoticePayload = (row: NoticeRow) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  author: row.author,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
})

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    const env = c.env
    await ensureBaseSchema(env.DB)

    const classIdParam = c.req.query('classId') ?? c.req.query('class_id')
    const classId = classIdParam ? Number(classIdParam) : null

    const statement = classId
      ? env.DB.prepare('SELECT * FROM notices WHERE class_id = ? ORDER BY created_at DESC').bind(classId)
      : env.DB.prepare('SELECT * FROM notices ORDER BY created_at DESC')

    const result = await statement.all<NoticeRow>()
    const rows = (result?.results ?? []).map(toNoticePayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[notices] Failed to fetch notices', error)
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

app.post('/', async (c) => {
  try {
    const env = c.env
    await ensureBaseSchema(env.DB)

    const body = await c.req.json<{
      title?: string
      content?: string
      classId?: number
      author?: string | null
    }>()

    const title = body.title?.trim()
    const content = body.content?.trim()
    const classId = body.classId
    const author = body.author?.trim() ?? null

    if (!title) {
      return Response.json({ success: false, count: 0, data: [], message: '공지 제목을 입력해주세요.' }, 400)
    }

    if (!content) {
      return Response.json({ success: false, count: 0, data: [], message: '공지 내용을 입력해주세요.' }, 400)
    }

    if (typeof classId !== 'number') {
      return Response.json({ success: false, count: 0, data: [], message: '수업 정보를 찾을 수 없습니다.' }, 400)
    }

    const insertResult = await env.DB
      .prepare('INSERT INTO notices (title, content, author, class_id) VALUES (?1, ?2, ?3, ?4) RETURNING *')
      .bind(title, content, author, classId)
      .all<NoticeRow>()

    const rows = (insertResult?.results ?? []).map(toNoticePayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[notices] Failed to create notice', error)
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

app.delete('/:id', async (c) => {
  try {
    const env = c.env
    await ensureBaseSchema(env.DB)

    const id = Number(c.req.param('id'))

    if (Number.isNaN(id)) {
      return Response.json({ success: false, count: 0, data: [], message: '삭제할 공지를 찾을 수 없습니다.' }, 400)
    }

    await env.DB.prepare('DELETE FROM notices WHERE id = ?1').bind(id).run()

    return Response.json({ success: true, count: 0, data: [] })
  } catch (error) {
    console.error('[notices] Failed to delete notice', error)
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
