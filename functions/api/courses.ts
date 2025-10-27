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

app.onError((err, c) => {
  console.error('[Courses API Error]', err)
  return c.json(
    {
      success: false,
      valid: false,
      message: '서버 내부 오류가 발생했습니다.'
    },
    500
  )
})

app.post('/verify', async (c) => {
  await ensureBaseSchema(c.env.DB)

  let payload: Record<string, unknown>
  try {
    payload = await c.req.json<Record<string, unknown>>()
  } catch (error) {
    return c.json({ success: false, valid: false, message: '유효한 JSON 본문이 필요합니다.' })
  }

  const courseIdRaw = normaliseCourseId(payload.courseId)
  const codeRaw = normaliseCourseId(payload.code)

  if (!courseIdRaw || !codeRaw) {
    return c.json({ success: false, valid: false, message: '강의 ID와 수강 코드를 모두 입력해주세요.' })
  }

  const courseIdLower = courseIdRaw.toLowerCase()
  const numericId = Number(courseIdRaw)

  let course: CourseRow | null = null

  if (!Number.isNaN(numericId)) {
    course = await c.env.DB
      .prepare('SELECT id, name, code, category FROM classes WHERE id = ?1 LIMIT 1')
      .bind(numericId)
      .first<CourseRow>()
  }

  if (!course) {
    course = await c.env.DB
      .prepare('SELECT id, name, code, category FROM classes WHERE LOWER(name) = ?1 OR LOWER(category) = ?1 LIMIT 1')
      .bind(courseIdLower)
      .first<CourseRow>()
  }

  if (!course) {
    return c.json({ success: false, valid: false, message: '등록되지 않은 강의입니다.' })
  }

  const storedCode = typeof course.code === 'string' ? course.code.trim() : ''
  if (!storedCode) {
    return c.json({
      success: false,
      valid: false,
      courseId: resolveCourseIdentifier(course),
      message: '강의 코드가 등록되지 않았습니다.'
    })
  }

  const inputCode = codeRaw.trim()
  const isValid = storedCode.localeCompare(inputCode, undefined, { sensitivity: 'accent' }) === 0

  if (!isValid) {
    return c.json({
      success: false,
      valid: false,
      courseId: resolveCourseIdentifier(course),
      message: '유효하지 않은 코드입니다.'
    })
  }

  const resolvedCourseId = resolveCourseIdentifier(course)

  return c.json({
    success: true,
    valid: true,
    matched: true,
    courseId: resolvedCourseId
  })
})

export const onRequest: PagesFunction<Env> = (context) => app.fetch(context.request, context.env, context)
export const onRequestPost: PagesFunction<Env> = (context) => app.fetch(context.request, context.env, context)

export default app
