import { Hono } from 'hono'
import { jsonResponse } from './_utils'

const app = new Hono()

app.get('/', (c) => jsonResponse(true, null, 'API Root OK'))

export default app
