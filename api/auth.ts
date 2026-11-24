// Email + password auth backed by MongoDB, issuing HS256 JWTs.
//
//   POST /api/auth  { action: "signup" | "login", email, password }
//   GET  /api/auth  (Authorization: Bearer <jwt>) -> { user }
//
// Deliberately self-contained: Vercel runs these functions as native ESM
// (`"type": "module"`), where extensionless relative imports between api files
// fail with ERR_MODULE_NOT_FOUND. All helpers live inline.
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { MongoClient, ObjectId, type Db } from 'mongodb'

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8
const KEY_LEN = 64
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

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

// --- HS256 JWT (node:crypto) ---
type JwtPayload = { sub: string; email: string; iat: number; exp: number }

const toBase64Url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

function jwtSecret(): string {
  return process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || 'studio-dev-insecure-secret-change-me'
}

function signJwt(input: { sub: string; email: string }): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = toBase64Url(
    JSON.stringify({ sub: input.sub, email: input.email, iat: now, exp: now + TOKEN_TTL_SECONDS }),
  )
  const data = `${header}.${payload}`
  const signature = toBase64Url(createHmac('sha256', jwtSecret()).update(data).digest())
  return `${data}.${signature}`
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

// --- scrypt passwords ---
function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password, salt)
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'))
  const expected = Buffer.from(hashHex, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
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

// --- users ---
type UserDoc = { _id: ObjectId; email: string; passwordHash: string; createdAt: Date }
type PublicUser = { id: string; email: string }

const publicUser = (doc: UserDoc): PublicUser => ({ id: doc._id.toHexString(), email: doc.email })

async function usersCollection() {
  const db = await getDb()
  const collection = db.collection<UserDoc>('users')
  await collection.createIndex({ email: 1 }, { unique: true })
  return collection
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const method = (req.method ?? 'GET').toUpperCase()

  if (!mongoConfigured()) {
    res.status(501).json({ error: 'Auth is not configured: set MONGODB_URI in Vercel.' })
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
      res.status(201).json({ token: signJwt({ sub: doc._id.toHexString(), email }), user: publicUser(doc) })
      return
    }

    if (action === 'login') {
      const doc = await collection.findOne({ email })
      if (!doc || !(await verifyPassword(password, doc.passwordHash))) {
        res.status(401).json({ error: 'Invalid email or password.' })
        return
      }
      res.status(200).json({ token: signJwt({ sub: doc._id.toHexString(), email: doc.email }), user: publicUser(doc) })
      return
    }

    res.status(400).json({ error: 'Unknown action.' })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Auth error' })
  }
}

