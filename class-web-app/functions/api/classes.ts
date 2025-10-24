import { Hono } from 'hono'

export const app = new Hono()

// 수업 목록 불러오기
app.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM classes').all()
    return c.json({ success: true, data: result.results || [] })
  } catch (err) {
    console.error('Error fetching classes:', err)
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, message: '수업 목록 불러오기 실패', error: message }, 500)
  }
})

// 새 수업 저장
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { name, uploadOption, uploadTime, days, uploadPeriod, study, category_id } = body

    await c.env.DB.prepare(`
      INSERT INTO classes (name, uploadOption, uploadTime, days, uploadPeriod, study, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        name || null,
        uploadOption || null,
        uploadTime || null,
        days || null,
        uploadPeriod || null,
        study || null,
        category_id || null
      )
      .run()

    return c.json({ success: true, message: '수업이 정상적으로 저장되었습니다.' })
  } catch (err) {
    console.error('Error saving class:', err)
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, message: '수업 저장 실패', error: message }, 500)
  }
})

export default app;
