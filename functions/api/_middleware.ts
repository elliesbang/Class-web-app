import type { PagesFunction } from '@cloudflare/workers-types'

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' }

export const onRequest: PagesFunction = async (context) => {
  try {
    const response = await context.next()

    const contentType = response.headers.get('Content-Type')
    if (!contentType) {
      const headers = new Headers(response.headers)
      headers.set('Content-Type', 'application/json; charset=utf-8')
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }

    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ success: false, message: '잘못된 응답 형식입니다.' }), {
        status: 500,
        headers: jsonHeaders,
      })
    }

    return response
  } catch (err) {
    console.error('[Global API Error]', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ success: false, message: '서버 내부 오류', error: errorMessage }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    )
  }
}
