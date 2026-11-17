import { Hono } from 'hono'

// The Worker in front of the static app (Cloudflare target). Studio keeps
// everything in the browser (localStorage), so there is only a health check
// here. The Vercel target uses api/health.ts and api/sync.ts instead.
type Env = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))
app.all('/api/health', (c) => c.json({ error: 'Method not allowed' }, 405, { Allow: 'GET, HEAD' }))

// Unknown API paths are a JSON 404, never the SPA's index.html.
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
