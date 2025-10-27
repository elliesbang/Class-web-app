import { Hono } from 'hono'

import { ensureBaseSchema, normaliseDate } from './_utils'

type Env = { DB: D1Database }

type VideoRow = {
  id: number
  title: string
  url: string
  description: string | null
  class_id: number
  created_at: string
  display_order: number | null
}

const toVideoPayload = (row: VideoRow) => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.description,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
  displayOrder: row.display_order,
})

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    const env = c.env
    await ensureBaseSchema(env.DB)

    const classIdParam = c.req.query('classId') ?? c.req.query('class_id')
    const classId = classIdParam ? Number(classIdParam) : null

    const statement = classId
      ? env.DB.prepare('SELECT * FROM videos WHERE class_id = ? ORDER BY display_order ASC, created_at DESC').bind(classId)
      : env.DB.prepare('SELECT * FROM videos ORDER BY class_id ASC, display_order ASC, created_at DESC')

    const result = await statement.all<VideoRow>()
    const rows = (result?.results ?? []).map(toVideoPayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[videos] Failed to fetch videos', error)
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
      url?: string
      description?: string | null
      classId?: number
    }>()

    const title = body.title?.trim()
    const url = body.url?.trim()
    const description = body.description?.trim() ?? null
    const classId = body.classId

    if (!title) {
      return Response.json({ success: false, count: 0, data: [], message: '영상 제목은 필수입니다.' }, 400)
    }

    if (!url) {
      return Response.json({ success: false, count: 0, data: [], message: '영상 주소 또는 코드를 입력해주세요.' }, 400)
    }

    if (typeof classId !== 'number') {
      return Response.json({ success: false, count: 0, data: [], message: '수업 정보를 찾을 수 없습니다.' }, 400)
    }

    const orderResult = await env.DB
      .prepare('SELECT COALESCE(MAX(display_order), -1) as maxOrder FROM videos WHERE class_id = ?1')
      .bind(classId)
      .all<{ maxOrder: number }>()
    const orderRows = orderResult?.results ?? []
    const nextOrder = ((orderRows[0]?.maxOrder as number | undefined) ?? -1) + 1

    const insertResult = await env.DB
      .prepare(
        'INSERT INTO videos (title, url, description, class_id, display_order) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *',
      )
      .bind(title, url, description, classId, nextOrder)
      .all<VideoRow>()

    const rows = (insertResult?.results ?? []).map(toVideoPayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[videos] Failed to create video', error)
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

app.put('/order', async (c) => {
  try {
    const env = c.env
    await ensureBaseSchema(env.DB)

    const body = await c.req.json<{ classId?: number; orderedIds?: number[] }>()
    const classId = body.classId
    const orderedIds = body.orderedIds

    if (typeof classId !== 'number' || !Array.isArray(orderedIds)) {
      return Response.json({ success: false, count: 0, data: [], message: '정렬 정보를 확인할 수 없습니다.' }, 400)
    }

    const updateStatements = orderedIds.map((id, index) =>
      env.DB.prepare('UPDATE videos SET display_order = ?1 WHERE id = ?2 AND class_id = ?3').bind(index, id, classId),
    )

    for (const statement of updateStatements) {
      await statement.run()
    }

    const updatedResult = await env.DB
      .prepare('SELECT * FROM videos WHERE class_id = ?1 ORDER BY display_order ASC, created_at DESC')
      .bind(classId)
      .all<VideoRow>()
    const rows = (updatedResult?.results ?? []).map(toVideoPayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[videos] Failed to reorder videos', error)
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
      return Response.json({ success: false, count: 0, data: [], message: '삭제할 영상을 찾을 수 없습니다.' }, 400)
    }

    await env.DB.prepare('DELETE FROM videos WHERE id = ?1').bind(id).run()

    return Response.json({ success: true, count: 0, data: [] })
  } catch (error) {
    console.error('[videos] Failed to delete video', error)
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
