import { Hono } from 'hono'

import { ensureBaseSchema, normaliseDate } from './_utils'

type Env = { DB: D1Database }

type MaterialRow = {
  id: number
  title: string
  file_url: string
  description: string | null
  file_name: string | null
  mime_type: string | null
  file_size: number | null
  class_id: number
  created_at: string
}

const toMaterialPayload = (row: MaterialRow) => ({
  id: row.id,
  title: row.title,
  fileUrl: row.file_url,
  description: row.description,
  fileName: row.file_name,
  mimeType: row.mime_type,
  fileSize: row.file_size,
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
      ? env.DB.prepare('SELECT * FROM materials WHERE class_id = ? ORDER BY created_at DESC').bind(classId)
      : env.DB.prepare('SELECT * FROM materials ORDER BY created_at DESC')

    const result = await statement.all<MaterialRow>()
    const rows = (result?.results ?? []).map(toMaterialPayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[materials] Failed to fetch materials', error)
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
      description?: string | null
      classId?: number
      fileUrl?: string
      fileName?: string | null
      mimeType?: string | null
      fileSize?: number | null
    }>()

    const title = body.title?.trim()
    const classId = body.classId
    const description = body.description?.trim() ?? null
    const fileUrl = body.fileUrl
    const fileName = body.fileName ?? null
    const mimeType = body.mimeType ?? null
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : null

    if (!title) {
      return Response.json({ success: false, count: 0, data: [], message: '자료 제목을 입력해주세요.' }, 400)
    }

    if (typeof classId !== 'number') {
      return Response.json({ success: false, count: 0, data: [], message: '수업 정보를 찾을 수 없습니다.' }, 400)
    }

    if (!fileUrl) {
      return Response.json({ success: false, count: 0, data: [], message: '업로드할 파일을 선택해주세요.' }, 400)
    }

    const insertResult = await env.DB
      .prepare(
        'INSERT INTO materials (title, file_url, description, file_name, mime_type, file_size, class_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING *',
      )
      .bind(title, fileUrl, description, fileName, mimeType, fileSize, classId)
      .all<MaterialRow>()

    const rows = (insertResult?.results ?? []).map(toMaterialPayload)

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[materials] Failed to create material', error)
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
      return Response.json({ success: false, count: 0, data: [], message: '삭제할 자료를 찾을 수 없습니다.' }, 400)
    }

    await env.DB.prepare('DELETE FROM materials WHERE id = ?1').bind(id).run()

    return Response.json({ success: true, count: 0, data: [] })
  } catch (error) {
    console.error('[materials] Failed to delete material', error)
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
