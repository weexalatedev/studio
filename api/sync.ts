// Per-user cloud sync for the workspace, backed by MongoDB and keyed by the
// authenticated user (see api/auth.ts). Without MONGODB_URI this returns 501
// and the app keeps everything in localStorage.
//
//   GET  /api/sync            -> { configured } capability probe (no auth)
//   GET  /api/sync  (Bearer)  -> { data, revision, updatedAt }
//   PUT  /api/sync  (Bearer)  { data: <workspace> }
import { bearerOf, parseBody, type ApiRequest, type ApiResponse } from './_lib/http'
import { verifyJwt } from './_lib/jwt'
import { getDb, mongoConfigured } from './_lib/mongo'

const MAX_BYTES = 2 * 1024 * 1024

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
