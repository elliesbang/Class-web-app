import { Context, Next } from 'hono'

export async function onRequest(context: Context, next: Next) {
  try {
    // 기본 JSON 헤더 설정
    context.header('Content-Type', 'application/json; charset=utf-8')

    await next()

    // 정상 응답인데 Content-Type이 빠진 경우
    const resType = context.res.headers.get('Content-Type')
    if (!resType || !resType.includes('application/json')) {
      context.res = new Response(
        JSON.stringify({ success: false, message: '잘못된 응답 형식입니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }
  } catch (err) {
    console.error('[Global API Error]', err)
    context.res = new Response(
      JSON.stringify({
        success: false,
        message: '서버 내부 오류',
        error: (err as Error).message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
}
