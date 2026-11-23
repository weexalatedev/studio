// Optional cloud sync for the workspace, backed by Neon (or any Postgres that
// the Neon HTTP driver can reach). Without DATABASE_URL this returns 501 and
// the app keeps everything in localStorage.
//
// Setup:
//   1. Create a free Neon project and copy its pooled connection string.
//   2. Run db/schema.sql against it.
//   3. In Vercel → Settings → Environment Variables add DATABASE_URL.
//   4. Type a long random sync token in Studio → Settings → Cloud sync.
import { createHash } from 'node:crypto'

import { neon } from '@neondatabase/serverless'
import { verifyToken } from '@clerk/backend'

type ApiRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}
type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

const MAX_BYTES = 2 * 1024 * 1024

function tokenOf(req: ApiRequest): string {
  const raw = req.headers['x-sync-token']
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').trim()
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    res.status(501).json({
      configured: false,
      error: 'Cloud sync is not configured: set DATABASE_URL in Vercel, then run db/schema.sql.',
    })
    return
  }

  const method = (req.method ?? 'GET').toUpperCase()

  // Resolve the caller's identity. When Clerk is configured we trust a verified
  // session JWT (sent as `Authorization: Bearer <token>`) and key the workspace
  // by the Clerk user id. Otherwise we fall back to the legacy sync token.
  const clerkSecret =
  process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY
  let clerkUserId: string | null = null
  if (clerkSecret) {
    const rawHeader = req.headers['authorization'] ?? req.headers['Authorization']
    const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
    const bearer = (headerValue ?? '').trim().replace(/^Bearer\s+/i, '')
    if (bearer) {
      try {
        const payload = await verifyToken(bearer, { secretKey: clerkSecret })
        clerkUserId = (payload.sub as string) ?? null
      } catch {
        res.status(401).json({ configured: true, error: 'Invalid or expired session.' })
        return
      }
    }
    if (!clerkUserId) {
      res.status(401).json({ configured: true, error: 'Sign in required.' })
      return
    }
  }

  const token = clerkUserId ? `clerk:${clerkUserId}` : tokenOf(req)

  // A bare GET is the capability probe the settings sheet uses.
  if (!token) {
    if (method === 'GET') res.status(200).json({ configured: true })
    else res.status(401).json({ configured: true, error: 'Missing x-sync-token header.' })
    return
  }

  if (token.length < 16) {
    res.status(401).json({ configured: true, error: 'The sync token must be at least 16 characters.' })
    return
  }

  const sql = neon(connectionString)
  const tokenHash = hashToken(token)

  try {
    if (method === 'GET') {
      const rows = (await sql`
        select data, revision, updated_at from studio_workspaces where token_hash = ${tokenHash}
      `) as { data: unknown; revision: number; updated_at: string }[]
      if (!rows.length) {
        res.status(404).json({ configured: true, error: 'No workspace saved for this token yet.' })
        return
      }
      res.status(200).json({
        configured: true,
        data: rows[0].data,
        revision: rows[0].revision,
        updatedAt: rows[0].updated_at,
      })
      return
    }

    if (method !== 'PUT') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    let parsed: unknown = req.body
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        res.status(400).json({ error: 'The request body is not valid JSON.' })
        return
      }
    }
    const data = (parsed as { data?: unknown } | null | undefined)?.data
    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'Send { data: <workspace> }.' })
      return
    }

    const serialized = JSON.stringify(data)
    if (serialized.length > MAX_BYTES) {
      res.status(413).json({ error: 'That workspace is larger than 2 MB.' })
      return
    }

    const rows = (await sql`
      insert into studio_workspaces (token_hash, data, revision, updated_at)
      values (${tokenHash}, ${serialized}::jsonb, 1, now())
      on conflict (token_hash) do update
        set data = excluded.data, revision = studio_workspaces.revision + 1, updated_at = now()
      returning revision
    `) as { revision: number }[]

    res.status(200).json({ configured: true, revision: rows[0]?.revision ?? 1 })
  } catch (error) {
    res.status(500).json({ configured: true, error: error instanceof Error ? error.message : 'Database error' })
  }
}
