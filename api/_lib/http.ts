// Shared request/response shapes and tiny helpers for the Vercel functions.
// Files under `api/_lib/` are never routed (Vercel ignores underscore folders).

export type ApiRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

export type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

export function headerOf(req: ApiRequest, name: string): string {
  const raw =
    req.headers[name] ??
    req.headers[name.toLowerCase()] ??
    req.headers[name.toUpperCase()]
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').trim()
}

/** The raw bearer token from `Authorization: Bearer <token>`, or ''. */
export function bearerOf(req: ApiRequest): string {
  return headerOf(req, 'authorization').replace(/^Bearer\s+/i, '')
}

/** Parse the JSON body whether Vercel already decoded it or handed us a string. */
export function parseBody(req: ApiRequest): Record<string, unknown> {
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
