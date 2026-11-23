// Client half of the per-user cloud sync (api/sync.ts). Everything is opt-in:
// without a configured database the app is a purely local, offline-first PWA.
// Requests are authenticated with the JWT from lib/auth.ts.

import { normalizeState, type State } from '../app/store'
import { getAuthToken } from './auth'

type ApiBody = {
  configured?: boolean
  data?: unknown
  revision?: number
  updatedAt?: string
  error?: string
}

async function call(method: 'GET' | 'PUT', data?: State): Promise<{ status: number; body: ApiBody }> {
  const headers: Record<string, string> = {}
  if (data) headers['Content-Type'] = 'application/json'
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

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
    const { status, body } = await call('GET')
    return status === 200 && body.configured === true
  } catch {
    return false
  }
}

export type PullResult = { state: State; revision: number; updatedAt?: string }

/** Fetch the saved workspace. Returns null when nothing has been pushed yet. */
export async function pullWorkspace(): Promise<PullResult | null> {
  const { status, body } = await call('GET')
  if (status === 404) return null
  if (status !== 200) throw new Error(body.error ?? 'Could not read the saved workspace.')
  if (!body.data) return null
  return { state: normalizeState(body.data), revision: body.revision ?? 0, updatedAt: body.updatedAt }
}

/** Overwrite the saved workspace with this device's state (last write wins). */
export async function pushWorkspace(state: State): Promise<number> {
  const { status, body } = await call('PUT', state)
  if (status !== 200) throw new Error(body.error ?? 'Could not save the workspace.')
  return body.revision ?? 0
}
