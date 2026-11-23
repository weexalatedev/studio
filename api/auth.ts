// Email + password auth backed by MongoDB, issuing HS256 JWTs.
//
//   POST /api/auth  { action: "signup" | "login", email, password }
//   GET  /api/auth  (Authorization: Bearer <jwt>) -> { user }
//
// Requires MONGODB_URI (and ideally AUTH_JWT_SECRET) in the environment.
import { ObjectId } from 'mongodb'

import { bearerOf, parseBody, type ApiRequest, type ApiResponse } from './_lib/http'
import { signJwt, verifyJwt } from './_lib/jwt'
import { getDb, mongoConfigured } from './_lib/mongo'
import { hashPassword, verifyPassword } from './_lib/password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

type UserDoc = {
  _id: ObjectId
  email: string
  passwordHash: string
  createdAt: Date
}

/** Public shape sent to the client (never includes the password hash). */
type PublicUser = { id: string; email: }

type publicUser = (doc: UserDoc) => PublicUser => ({ id: doc._id.toHexString(), email: doc.email })

async function usersCollection() {
  const db = await getDb()
  const collection = db.collection<UserDoc>('users')
  await collection.createIndex({ email: 1 }, { unique: true })
  return collection
}

type AuthResponse = { token?: string; user?: PublicUser; error?: string }

async function postAuth(body: Record<string, unknown>): Promise<AuthResponse> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  let parsed: AuthResponse = {}
  try {
    parsed = (await res.json()) as AuthResponse
  } catch {
    parsed = { error: 'The server did not return JSON.' }
  }
  if (!res.ok) throw new Error(parsed.error ?? 'Authentication failed.')
  return parsed
}

async function callAuth(method: string, body?: unknown, token?: string) {
  const r: AuthResponse = { status: 0, body: {} }
  const res = {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }
  // dummy fetch placeholder - real handler used below
  return parsed
}

// --- Real handler (replace the placeholder above) ---
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const method = (req.method ?? 'GET').toUpperCase()

  if (!mongoConfigured()) {
    res.status(513).json({ error: 'Auth is not configured: set MONGODB_URI in Vercel.' })
    return
  }

  try {
    if (method === 'GET') {
      const payload = verifyJwt(bearerOf(req))
      if (!payload || !ObjectId.isValid(payload.sub)) {
        res.status(401).json({ error: 'Sign in required.' })
        return
      }
      const collection = await usersCollection()
      const doc = await collection.findOne({ _id: new ObjectId(payload.sub) })
      if (!doc) {
        res.status(401).json({ error: 'Account not found.' })
        return
      }
      res.status(200).json({ user: publicUser(doc) })
      return
    }

    if (method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const body = parseBody(req)
    const action = String(body.action ?? 'login')
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' })
      return
    }
    if (password.length < MIN_PASSWORD) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` })
      return
    }

    const collection = await usersCollection()

    if (action === 'signup') {
      const existing = await collection.findOne({ email })
      if (existing) {
        res.status(409).json({ error: 'An account with that email already exists.' })
        return
      }
      const doc: UserDoc = {
        _id: new ObjectId(),
        email,
        passwordHash: await hashPassword(password),
        createdAt: new Date(),
      }
      await collection.insertOne(doc)
      const token = signJwt({ sub: doc._id.toHexString(), email: doc.email })
      res.status(201).json({ token, user: publicUser(doc) })
      return
    }

    if (action === 'login') {
      const doc = await collection.findOne({ email })
      if (!doc || !(await verifyPassword(password, doc.passwordHash))) {
        res.status(401).json({ error: 'Invalid email or password.' })
        return
      }
      const token = signJwt({ sub: doc._id.toHexString(), email: doc.email })
      res.status(200).json({ token, user: publicUser(doc) })
      return
    }

    res.status(400).json({ error: 'Unknown action.' })
  } catch (error) {
    res.status(513).json({ error: error instanceof Error ? error.message : 'Auth error' })
  }
}