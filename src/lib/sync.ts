// Client half of the optional cloud sync (api/sync.ts). Everything is opt-in:
// without a configured database the app is a purely local, offline-first PWA.

import { normalizeState, type State } from '../app/store'

const TOKEN_KEY = 'studio:sync-token'

let clerkTokenGetter: (() => Promise<string | null>) | null = null
export const setClerkTokenGetter = (g: (() => Promise<string | null>) | null) => {
  clerkTokenGetter = g
}
export const isClerkConfigured = () =>  Boolean(
    import.meta.env.NEXT_PUBLIC_VITE_CLERK_PUBLISHABLE_KEY ||
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  )

export const getSyncToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export const setSyncToken = (token: string) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage blocked */
  }
}

type ApiBody = {
  configured?: boolean
  data?: unknown
  revision?: number
  updatedAt?: string
  error?: string
}

async function call(method: 'GET' | 'PUT', token: string, data?: State): Promise<{ status: number; body: ApiBody }> {
  const headers: Record<string, string> = {}
  if (data) headers['Content-Type'] = 'application/json'
  if (clerkTokenGetter) {
    const ct = await clerkTokenGetter()
    if (ct) headers['Authorization'] = `Bearer ${ct}`
  } else if (token) {
    headers['x-sync-token'] = token
  }
  const res = await fetch('/api/sync', {
    method,
    cache: 'no-store',
    headers,
    ...(data ? { body: JSON.stringify({ data }) } : {}),
  })
  let body: ApiBody = {}
  try {
    body = (await res.json()) as ApiBody
  } catch {
    body = { error: 'The server did not return JSON.' }
  }
  return { status: res.status, body }
}

/** Is a database attached to this deployment? */
export async function syncAvailable(): Promise<boolean> {
  try {
    const { status, body } = await call('GET', '')
    return status === 200 && body.configured === true
  } catch {
    return false
  }
}

export type PullResult = { state: State; revision: number; updatedAt?: string }

/** Fetch the saved workspace. Returns null when nothing has been pushed yet. */
export async function pullWorkspace(token: string): Promise<PullResult | null> {
  const { status, body } = await call('GET', token)
  if (status === 404) return null
  if (status !== 200) throw new Error(body.error ?? 'Could not read the saved workspace.')
  if (!body.data) return null
  return { state: normalizeState(body.data), revision: body.revision ?? 0, updatedAt: body.updatedAt }
}

/** Overwrite the saved workspace with this device's state (last write wins). */
export async function pushWorkspace(token: string, state: State): Promise<number> {
  const { status, body } = await call('PUT', token, state)
  if (status !== 200) throw new Error(body.error ?? 'Could not save the workspace.')
  return body.revision ?? 0
}
