import type { MiddlewareHandler } from 'hono'

type WithD1Init = {
  binding?: string
  storeKey?: string
}

export declare const withD1: (init?: WithD1Init | string) => MiddlewareHandler
export type WithD1 = ReturnType<typeof withD1>
