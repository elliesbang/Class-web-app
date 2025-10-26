import { Hono } from 'hono'
import { withD1 } from '@hono/d1'
import { z } from 'zod'

type Env = {
  DB?: D1Database
}

type PagesContext<Bindings> = {
  request: Request
  env: Bindings
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

type PagesHandler<Bindings> = (context: PagesContext<Bindings>) => Response | Promise<Response>

const responseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.unknown())
})

const emptyResponse = responseSchema.parse({ success: true, data: [] })

const app = new Hono<{ Bindings: Env }>()

app.use('*', async (c, next) => {
  const middleware = withD1({ binding: 'DB', storeKey: 'DB' })

  try {
    await middleware(c, next)
  } catch (error) {
    console.warn('[api/categories] Failed to bind D1 instance:', error)
    await next()
  }
})

app.get('/', c => c.json(emptyResponse))

export const onRequest: PagesHandler<Env> = context => app.fetch(context.request, context.env, context)

export default app
