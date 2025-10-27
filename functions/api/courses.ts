import { Hono } from 'hono'

import { ensureBaseSchema } from './_utils'

type Env = {
  DB: D1Database
}

type CourseRow = {
  id: number
  name: string | null
  code: string | null
  category: string | null
}

const normaliseCourseId = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return null
}

const resolveCourseIdentifier = (row: CourseRow) => {
  const identifier = [row.category, row.name]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find((value) => value.length > 0)

  return identifier ?? String(row.id)
}

const app = new Hono<{ Bindings: Env }>()

app.post('/verify', async (c) => {
  try {
    const env = c.env
    await ensureBaseSchema(env.DB)

    let payload: Record<string, unknown>
    try {
      payload = await c.req.json<Record<string, unknown>>()
    } catch (error) {
      return Response.json({ success: false, count: 0, data: [], message: '유효한 JSON 본문이 필요합니다.' }, 400)
    }

    const courseIdRaw = normaliseCourseId(payload.courseId)
    const codeRaw = normaliseCourseId(payload.code)

    if (!courseIdRaw || !codeRaw) {
      return Response.json({ success: false, count: 0, data: [], message: '강의 ID와 수강 코드를 모두 입력해주세요.' }, 400)
    }

    const courseIdLower = courseIdRaw.toLowerCase()
    const numericId = Number(courseIdRaw)

    let course: CourseRow | null = null

    if (!Number.isNaN(numericId)) {
      const numericResult = await env.DB
        .prepare('SELECT id, name, code, category FROM classes WHERE id = ?1')
        .bind(numericId)
        .all<CourseRow>()
      const numericRows = numericResult?.results ?? []
      course = numericRows[0] ?? null
    }

    if (!course) {
      const namedResult = await env.DB
        .prepare('SELECT id, name, code, category FROM classes WHERE LOWER(name) = ?1 OR LOWER(category) = ?1')
        .bind(courseIdLower)
        .all<CourseRow>()
      const namedRows = namedResult?.results ?? []
      course = namedRows[0] ?? null
    }

    if (!course) {
      return Response.json({ success: false, count: 0, data: [], message: '등록되지 않은 강의입니다.' }, 404)
    }

    const storedCode = typeof course.code === 'string' ? course.code.trim() : ''
    if (!storedCode) {
      const rows = [
        {
          valid: false,
          courseId: resolveCourseIdentifier(course),
          message: '강의 코드가 등록되지 않았습니다.',
        },
      ]
      return Response.json({ success: false, count: rows.length, data: rows }, 400)
    }

    const inputCode = codeRaw.trim()
    const isValid = storedCode.localeCompare(inputCode, undefined, { sensitivity: 'accent' }) === 0

    if (!isValid) {
      const rows = [
        {
          valid: false,
          courseId: resolveCourseIdentifier(course),
          message: '유효하지 않은 코드입니다.',
        },
      ]
      return Response.json({ success: false, count: rows.length, data: rows }, 401)
    }

    const rows = [
      {
        valid: true,
        matched: true,
        courseId: resolveCourseIdentifier(course),
      },
    ]

    return Response.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('[courses] Failed to verify course', error)
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
