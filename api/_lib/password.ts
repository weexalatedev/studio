// Password hashing with node:crypto scrypt (no external deps).
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LEN = 64

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

/** Format: `scrypt$<saltHex>$<hashHex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password, salt)
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'))
  const expected = Buffer.from(hashHex, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
