// Minimal, dependency-free HS256 JWT using node:crypto.
import { createHmac, timingSafeEqual } from 'node:crypto'

export type JwtPayload = {
  sub: string
  email: string
  iat: number
  exp: number
}

const toBase64Url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

const signingSecret = process.env.AUTH_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'studio-dev-insecure-secret-change-me'

const toBase64Url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

export function signJwt(
  input: { sub: string; email: string },
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = toBase64Url(
    JSON.stringify({ sub: input.sub, email: input.email, iat: now, exp: now + ttlSeconds }),
  )
  const data = `${header}.${payload}`
  const signature = toBase64Url(createHmac('sha256', getSigningSecret()).update(data).digest())
  return `${data}.${signature}`
}

export function getSigningSecret(): string {
  return process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || 'studio-dev-insecure-secret-change-me'
}

export function verifyJwt(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  if (!header || !payload || !signature) return null

  const expected = toBase64Url(createHmac('sha256', getSigningSecret()).update(`${header}.${payload}`).digest())
  const actualBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null
  }

  try {
    const decoded = JSON.parse(fromBase64Url(payload).toString('utf8')) as JwtPayload
    if (!decoded?.sub || typeof decoded.exp !== 'number') return null
    if (decoded.exp * 1000 < Date.now()) return null
    return decoded
  } catch {
    return null
  }
}