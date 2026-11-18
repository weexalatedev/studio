import { useEffect, useState } from 'react'

import { UserButton, useAuth, useUser } from '@clerk/clerk-react'

import { Button } from '../components/Button'
import { CloudDownload, CloudUpload } from 'lucide-react'
import type { Actions, State } from './store'
import { pullWorkspace, pushWorkspace, setClerkTokenGetter, syncAvailable } from '../lib/sync'

export function ClerkCloudSync({ state, actions, onNotice }: { state: State; actions: Actions; onNotice: (msg: string, undo?: () => void) => void }) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<'push' | 'pull' | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setClerkTokenGetter(async () => (await getToken()) ?? null)
    return () => setClerkTokenGetter(null)
  }, [getToken])

  useEffect(() => {
    let alive = true
    syncAvailable().then((ok) => {
      if (alive) setAvailable(ok)
    })
    return () => {
      alive = false
    }
  }, [])

  const push = async () => {
    setBusy('push')
    setMessage(null)
    try {
      const revision = await pushWorkspace('', state)
      setMessage({ ok: true, text: `Saved revision ${revision}.` })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not save.' })
    } finally {
      setBusy(null)
    }
  }

  const pull = async () => {
    setBusy('pull')
    setMessage(null)
    try {
      const result = await pullWorkspace('')
      if (!result) {
        setMessage({ ok: false, text: 'Nothing saved for your account yet. Push first.' })
        return
      }
      const before = state
      actions.replace(result.state)
      onNotice(`Pulled revision ${result.revision}`, () => actions.replace(before))
      setMessage({ ok: true, text: `Loaded revision ${result.revision}.` })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not load.' })
    } finally {
      setBusy(null)
    }
  }

  if (available === null) return <p className="text-[13.5px] text-muted">Checking…</p>
  if (!available) {
    return (
      <div className="rounded-[14px] border border-dashed border-line-strong px-4 py-3 text-[13.5px] leading-relaxed text-muted">
        <p className="font-semibold text-ink-2">No database is attached to this deployment.</p>
        <p className="mt-1">
          Add a free Neon Postgres, set <code className="rounded bg-hover px-1 py-0.5 text-[12px]">DATABASE_URL</code> in Vercel and run{' '}
          <code className="rounded bg-hover px-1 py-0.5 text-[12px]">db/schema.sql</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[13.5px] text-muted">
        Signed in as <span className="font-semibold text-ink-2">{user?.primaryEmailAddress?.emailAddress ?? 'you'}</span>. Your workspace syncs to the cloud under your account.
      </p>
      <UserButton afterSignOutUrl="/" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={busy === 'push'} disabled={busy !== null} onClick={push}>
          <CloudUpload size={16} /> Push this device
        </Button>
        <Button variant="secondary" loading={busy === 'pull'} disabled={busy !== null} onClick={pull}>
          <CloudDownload size={16} /> Pull from cloud
        </Button>
      </div>
      {message && (
        <p role="status" className={`text-[13px] ${message.ok ? 'text-success-ink' : 'text-danger-ink'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}