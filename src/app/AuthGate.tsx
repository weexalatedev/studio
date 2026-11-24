import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../components/Button'
import { TextInput } from '../components/TextField'
import { getCurrentUser, refreshUser, signIn, signUp, subscribeAuth, type AuthUser } from '../lib/auth'

/** Gates the app behind email + password auth (JWT backed by api/auth.ts). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser())
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeAuth(() => setUser(getCurrentUser())), [])

  useEffect(() => {
    let alive = true
    refreshUser().finally(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signup') await signUp(email.trim(), password)
      else await signIn(email.trim(), password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return <div className="flex min-h-dvh items-center justify-center text-[14px] text-muted">Loading…</div>
  }

  if (user) return <>{children}</>

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fa] p-6">
      <div className="w-full max-w-sm rounded-[16px] border border-line bg-white p-6 shadow-sm">
        <h1 className="text-[20px] font-semibold text-ink">
          {mode === 'signup' ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="mt-1 text-[13.5px] text-muted">
          {mode === 'signup' ? 'Start with a fresh workspace.' : 'Welcome back to Studio.'}
        </p>
        <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
            Email
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
            Password
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-[13px] text-danger-ink">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" loading={busy} disabled={busy}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 w-full text-center text-[13px] font-medium text-inbox hover:underline"
          onClick={() => {
            setMode(mode === 'signup' ? 'login' : 'signup')
            setError(null)
          }}
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  )
}
