import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { Modal } from '../components/Modal'
import { TextInput } from '../components/TextField'
import { TonePicker } from '../components/TonePicker'
import { toneSolid } from '../components/tones'
import { MEMBER_TONES, type Tone } from '../data'
import { memberLoad, totals } from '../lib/agency'
import { money } from '../lib/format'
import { Avatar, EmptyHint, Field, Panel, Pill, ProgressBar, StatCard } from './agencyUi'
import type { Actions, Member, State } from './store'

type Props = { state: State; actions: Actions }

/** The team, their capacity this week and what they are on. */
export function TeamView({ state, actions }: Props) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const t = totals(state)
  const currency = state.prefs.currency

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Team" value={state.members.length} hint="people on the books" tone="teal" />
        <StatCard label="Capacity" value={`${t.capacityHours}h`} hint="bookable per week" tone="upcoming" />
        <StatCard label="Booked" value={`${t.bookedHours}h`} hint={`${t.utilization}% utilisation`} tone="inbox" />
        <StatCard label="Retainers" value={money(t.retainerValue, currency, true)} hint="per month, active clients" tone="green" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-photo text-[15px] font-semibold">Team</h2>
        <Button variant="primary" className="!rounded-full" onClick={() => setCreating(true)}>
          <UserPlus size={16} /> Add member
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.members.map((member) => {
          const load = memberLoad(state, member.id)
          const tone: Tone = load.load > 100 ? 'rose' : load.load > 85 ? 'today' : 'green'
          const projects = [
            ...new Set(state.tasks.filter((t) => t.assigneeId === member.id && !t.done && t.projectId).map((t) => t.projectId)),
          ]
            .map((id) => state.projects.find((p) => p.id === id))
            .filter((p): p is NonNullable<typeof p> => !!p)
            .slice(0, 3)
          return (
            <Panel key={member.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar member={member} size={40} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15.5px] font-semibold text-ink">{member.name}</h3>
                  <p className="truncate text-[12.5px] text-muted">{member.role || 'No role'}</p>
                </div>
                <IconButton label={`Edit ${member.name}`} onClick={() => setEditing(member)}>
                  <Pencil size={15} />
                </IconButton>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-muted">This week</span>
                  <span className="font-semibold tabular-nums text-ink">
                    {load.hours}h / {load.capacity}h
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={load.load} tone={tone} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Pill label={`${load.openTasks} open`} tone="slate" dot={false} />
                <Pill label={member.rate ? `${money(member.rate, currency)}/h` : 'No rate'} tone="green" dot={false} />
                {load.load > 100 && <Pill label="Over capacity" tone="rose" />}
              </div>
              {projects.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                  {projects.map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5 text-[12px] text-muted">
                      <span className="size-1.5 rounded-full" style={{ background: toneSolid(state.clients.find((c) => c.id === p.clientId)?.tone ?? 'slate') }} />
                      <span className="max-w-[150px] truncate">{p.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )
        })}
      </div>
      {state.members.length === 0 && <EmptyHint>No team yet. Add people to plan capacity and assign work.</EmptyHint>}

      <MemberFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(name, patch) => {
          actions.addMember(name, patch)
          setCreating(false)
        }}
      />
      <MemberFormModal
        open={!!editing}
        member={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSave={(name, patch) => {
          if (editing) actions.updateMember(editing.id, { name, ...patch })
          setEditing(null)
        }}
        onDelete={
          editing
            ? () => {
                actions.removeMember(editing.id)
                setEditing(null)
              }
            : undefined
        }
      />
    </div>
  )
}

function MemberFormModal({
  open,
  onClose,
  member,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  member?: Member
  onSave: (name: string, patch: Partial<Member>) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState(member?.role ?? '')
  const [rate, setRate] = useState(member ? String(member.rate) : '')
  const [capacity, setCapacity] = useState(member ? String(member.capacity) : '32')
  const [tone, setTone] = useState<Tone>(member?.tone ?? MEMBER_TONES[0])
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(member?.name ?? '')
    setRole(member?.role ?? '')
    setRate(member ? String(member.rate) : '')
    setCapacity(member ? String(member.capacity) : '32')
    setTone(member?.tone ?? MEMBER_TONES[0])
    setError(null)
    setConfirming(false)
  }, [open, member])

  const submit = () => {
    const n = name.trim()
    if (!n) return setError('Give this person a name.')
    onSave(n, {
      role: role.trim(),
      rate: Math.max(0, Number(rate) || 0),
      capacity: Math.min(80, Math.max(0, Number(capacity) || 0)),
      tone,
    })
  }

  return (
    <Modal open={open} onClose={onClose} label={member ? `Edit ${member.name}` : 'Add a team member'} width={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex min-h-0 flex-col"
      >
        <header className="px-5 pt-4 pb-1">
          <h2 className="text-[18px] font-semibold text-ink">{member ? 'Edit member' : 'Add a team member'}</h2>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name">
                <TextInput autoFocus value={name} onChange={(e) => { setName(e.target.value); setError(null) }} placeholder="Sam Wu" maxLength={60} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Role">
                <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Design Lead" maxLength={60} />
              </Field>
            </div>
            <Field label="Hours a week">
              <TextInput type="number" min={0} max={80} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </Field>
            <Field label="Hourly rate">
              <TextInput type="number" min={0} step={5} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="120" />
            </Field>
          </div>
          <div className="mt-3">
            <span className="text-[13px] font-semibold text-ink-2">Colour</span>
            <div className="mt-1.5">
              <TonePicker value={tone} onChange={setTone} />
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-2 rounded-[10px] bg-danger/8 px-3 py-2 text-[13px] text-danger-ink">
              {error}
            </p>
          )}
        </div>
        <footer className="flex items-center gap-2 border-t border-line px-5 py-3">
          {onDelete && (
            <div className="mr-auto">
              {confirming ? (
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  Remove member
                </Button>
              ) : (
                <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
                  <Trash2 size={14} /> Remove
                </Button>
              )}
            </div>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </footer>
      </form>
    </Modal>
  )
}
