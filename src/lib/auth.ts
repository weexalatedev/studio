// Client half of the JWT auth in api/auth.ts. The token lives in localStorage
// and is sent to /api/auth (for "me") and /api/sync (as a Bearer token).

const TOKEN_KEY = 'studio:auth-token'

export type AuthUser = { id: string; email: string }

let currentUser: AuthUser | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

/** Subscribe to auth changes (sign in, sign out, profile refresh). */
export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAuthToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAuthToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage blocked */
  }
  notify()
}

export function getCurrentUser(): AuthUser | null {
  return currentUser
}

function setCurrentUser(user: AuthUser | null) {
  currentUser = user
  notify()
}

type AuthResponse = { token?: string; user?: AuthUser; error?: string }

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

export async function signUp(email: string, password: string): Promise<AuthUser> {
  const result = await postAuth({ action: 'signup', email, password })
  if (!result.token || !result.user) throw new Error('Sign up did not return a session.')
  setAuthToken(result.token)
  setCurrentUser(result.user)
  return result.user
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const result = await postAuth({ action: 'login', email, password })
  if (!result.token || !result.user) throw new Error('Sign in did not return a session.')
  setAuthToken(result.token)
  setCurrentUser(result.user)
  return result.user
}

export function signOut() {
  setAuthToken('')
  setCurrentUser(null)
}

/** Validate the stored token against the server and load the current user. */
export async function refreshUser(): Promise<AuthUser | null> {
  const token = getAuthToken()
  if (!token) {
    setCurrentUser(null)
    return null
  }
  try {
    const res = await fetch('/api/auth', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      setAuthToken('')
      setCurrentUser(null)
      return null
    }
    const body = (await res.json()) as { user?: AuthUser }
    if (!body.user) {
      setAuthToken('')
      setCurrentUser(null)
      return null
    }
    setCurrentUser(body.user)
    return body.user
  } catch {
    return null
  }
}
