declare module '@hono/d1' {
  import type { MiddlewareHandler } from 'hono'

  export type WithD1Init = {
    binding?: string
    storeKey?: string
  }

  export const withD1: (init?: WithD1Init | string) => MiddlewareHandler
  export type WithD1 = ReturnType<typeof withD1>
}
