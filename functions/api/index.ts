import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('API Root OK'))

export default app
