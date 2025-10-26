import type { MiddlewareHandler } from 'hono'

type WithD1Init = {
  binding?: string
  storeKey?: string
}

const DEFAULT_BINDING = 'DB'
const DEFAULT_STORE_KEY = 'd1'

const resolveOptions = (init: WithD1Init | string | undefined) => {
  if (typeof init === 'string') {
    return { binding: init, storeKey: DEFAULT_STORE_KEY }
  }

  return {
    binding: init?.binding ?? DEFAULT_BINDING,
    storeKey: init?.storeKey ?? DEFAULT_STORE_KEY
  }
}

export const withD1 = (init?: WithD1Init | string): MiddlewareHandler => {
  const { binding, storeKey } = resolveOptions(init)

  return async (c, next) => {
    const bindings = c.env as Record<string, unknown> | undefined
    const database = bindings?.[binding]

    if (!database) {
      throw new Error(`D1 binding "${binding}" is not available in the current environment.`)
    }

    c.set(storeKey, database)
    await next()
  }
}

export type WithD1 = ReturnType<typeof withD1>
