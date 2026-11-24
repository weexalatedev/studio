// Per-user cloud sync backed by MongoDB, keyed by the authenticated user id.
// Self-contained (no cross-file imports) so Vercel's native ESM can load it.
//
//   GET  /api/sync            -> { configured } capability probe (no auth)
//   GET  /api/sync  (Bearer)  -> { data, revision, updatedAt }
//   PUT  /api/sync  (Bearer)  { data: <workspace> }
import { createHmac, timingSafeEqual } from 'node:crypto'
import { MongoClient, type Db } from 'mongodb'

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

function headerOf(req: ApiRequest, name: string): string {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()] ?? req.headers[name.toUpperCase()]
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').trim()
}

function bearerOf(req: ApiRequest): string {
  return headerOf(req, 'authorization').replace(/^Bearer\s+/i, '')
}

function parseBody(req: ApiRequest): Record<string, unknown> {
  let parsed: unknown = req.body
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return {}
    }
  }
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
}

// --- HS256 JWT verify (must match api/auth.ts) ---
type JwtPayload = { sub: string; email: string; iat: number; exp: number }

const toBase64Url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

function jwtSecret(): string {
  return process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || 'studio-dev-insecure-secret-change-me'
}

function verifyJwt(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  if (!header || !payload || !signature) return null
  const expected = toBase64Url(createHmac('sha256', jwtSecret()).update(`${header}.${payload}`).digest())
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const decoded = JSON.parse(fromBase64Url(payload).toString('utf8')) as JwtPayload
    if (!decoded?.sub || typeof decoded.exp !== 'number') return null
    if (decoded.exp * 1000 < Date.now()) return null
    return decoded
  } catch {
    return null
  }
}

// --- MongoDB (cached client) ---
let clientPromise: Promise<MongoClient> | null = null

function mongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI)
}

async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set.')
  if (!clientPromise) clientPromise = new MongoClient(uri).connect()
  const client = await clientPromise
  return client.db(process.env.MONGODB_DB || 'studio')
}

type WorkspaceDoc = {
  userId: string
  data: Record<string, unknown>
  revision: number
  updatedAt: Date
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const method = (req.method ?? 'GET').toUpperCase()

  if (!mongoConfigured()) {
    res.status(501).json({
      configured: false,
      error: 'Cloud sync is not configured: set MONGODB_URI in Vercel.',
    })
    return
  }

  const payload = verifyJwt(bearerOf(req))

  // A bare GET is the capability probe the settings sheet uses.
  if (method === 'GET' && !payload) {
    res.status(200).json({ configured: true })
    return
  }

  if (!payload) {
    res.status(401).json({ configured: true, error: 'Sign in required.' })
    return
  }

  try {
    const db = await getDb()
    const collection = db.collection<WorkspaceDoc>('workspaces')
    await collection.createIndex({ userId: 1 }, { unique: true })
    const userId = payload.sub

    if (method === 'GET') {
      const doc = await collection.findOne({ userId })
      if (!doc) {
        res.status(404).json({ configured: true, error: 'No workspace saved yet.' })
        return
      }
      res.status(200).json({
        configured: true,
        data: doc.data,
        revision: doc.revision,
        updatedAt: doc.updatedAt.toISOString(),
      })
      return
    }

    if (method !== 'PUT') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const incoming = parseBody(req).data
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Send { data: <workspace> }.' })
      return
    }
    const data = incoming as Record<string, unknown>

    if (JSON.stringify(data).length > MAX_BYTES) {
      res.status(413).json({ error: 'That workspace is larger than 2 MB.' })
      return
    }

    const existing = await collection.findOne({ userId }, { projection: { revision: 1 } })
    const revision = (existing?.revision ?? 0) + 1

    await collection.updateOne(
      { userId },
      { $set: { data, revision, updatedAt: new Date() } },
      { upsert: true },
    )

    res.status(200).json({ configured: true, revision })
  } catch (error) {
    res.status(500).json({ configured: true, error: error instanceof Error ? error.message : 'Database error' })
  }
}

