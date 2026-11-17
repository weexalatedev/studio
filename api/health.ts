// Vercel Node function: same shape as the Worker's GET /api/health.
type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

export default function handler(_req: unknown, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ ok: true })
}
