import { ArrowLeft, ArrowRight, Mail, Plus, Trash2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { TextArea, TextInput } from '../components/TextField'
import { TonePicker } from '../components/TonePicker'
import { toneSolid, toneTint } from '../components/tones'
import { CLIENT_STATUSES, PROJECT_STATUSES, type ClientStatus, type Tone } from '../data'
import { clientStats, projectHealth, projectStats } from '../lib/agency'
import { dateLabel, hoursLabel, money } from '../lib/format'
import { EmptyHint, Field, Panel, PanelHeading, Pill, ProgressBar, StatCard } from './agencyUi'
import { TaskLine } from './TaskLine'
import type { Actions, Client, State, View } from './store'

type Props = {
  state: State
  actions: Actions
  view: View
  onNavigate: (view: View) => void
  onOpenTask: (id: string) => void
  onToggleTask: (task: State['tasks'][number]) => void
}

const statusMeta = (id: ClientStatus) => CLIENT_STATUSES.find((s) => s.id === id) ?? CLIENT_STATUSES[0]

export function ClientsView({ state, actions, view, onNavigate, onOpenTask, onToggleTask }: Props) {
  if (view.kind === 'client') {
    const client = state.clients.find((c) => c.id === view.id)
    if (!client) {
      return (
        <div>
          <EmptyHint>That client no longer exists.</EmptyHint>
          <Button className="mt-3" variant="secondary" onClick={() => onNavigate({ kind: 'clients' })}>
            <ArrowLeft size={15} /> All clients
          </Button>
        </div>
      )
    }
    return <ClientDetail client={client} state={state} actions={actions} onNavigate={onNavigate} onOpenTask={onOpenTask} onToggleTask={onToggleTask} />
  }
  return <ClientList state={state} actions={actions} onNavigate={onNavigate} />
}

function ClientList({ state, actions, onNavigate }: Pick<Props, 'state' | 'actions' | 'onNavigate'>) {
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | ClientStatus>('all')
  const clients = state.clients.filter((c) => filter === 'all' || c.status === filter)
  const currency = state.prefs.currency

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...CLIENT_STATUSES.map((s) => s.id)] as const).map((id) => {
            const label = id === 'all' ? 'All' : statusMeta(id).label
            const active = filter === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(id)}
                className={`hit-40 h-8 rounded-full px-3 text-[13px] font-semibold transition-colors ${
                  active ? 'bg-white text-ink shadow-[var(--shadow-row)]' : 'bg-white/45 text-ink-2 hover:bg-white/70'
                }`}
              >
                {label}
                <span className="ml-1.5 text-[11.5px] tabular-nums text-muted">
                  {id === 'all' ? state.clients.length : state.clients.filter((c) => c.status === id).length}
                </span>
              </button>
            )
          })}
        </div>
        <Button className="ml-auto !rounded-full" variant="primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> New client
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {clients.map((client) => {
          const stats = clientStats(state, client.id)
          const meta = statusMeta(client.status)
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onNavigate({ kind: 'client', id: client.id })}
              className="group relative overflow-hidden rounded-[20px] bg-white p-4 text-left shadow-[var(--shadow-row)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgb(16_24_40/0.08),0_16px_30px_-16px_rgb(16_24_40/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox"
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[4px]" style={{ background: `linear-gradient(180deg, ${toneTint(client.tone, 0)}, ${toneSolid(client.tone)})` }} />
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[16px] font-semibold text-ink">{client.name}</h3>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">{client.contact || 'No contact'}</p>
                </div>
                <Pill label={meta.label} tone={meta.tone} />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
                <div>
                  <dt className="text-[11px] text-muted uppercase">Projects</dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-ink">{stats.projects}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted uppercase">Open</dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-ink">{stats.openTasks}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted uppercase">Overdue</dt>
                  <dd className={`text-[15px] font-semibold tabular-nums ${stats.overdueTasks ? 'text-danger-ink' : 'text-ink'}`}>{stats.overdueTasks}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[12px] text-muted">
                {client.retainer > 0 ? `${money(client.retainer, currency)} / month retainer` : 'No retainer'} · {hoursLabel(stats.weekMinutes)} this week
              </p>
            </button>
          )
        })}
      </div>
      {clients.length === 0 && <EmptyHint>No clients in this filter. Add one to start tracking a project.</EmptyHint>}

      <ClientFormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="New client"
        onSave={(patch) => {
          actions.addClient(patch.name, patch)
          setCreating(false)
          return true
        }}
      />
    </div>
  )
}

function ClientDetail({
  client,
  state,
  actions,
  onNavigate,
  onOpenTask,
  onToggleTask,
}: Pick<Props, 'state' | 'actions' | 'onNavigate' | 'onOpenTask' | 'onToggleTask'> & { client: Client }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const stats = clientStats(state, client.id)
  const projects = state.projects.filter((p) => p.clientId === client.id)
  const projectIds = new Set(projects.map((p) => p.id))
  const tasks = state.tasks
    .filter((t) => t.clientId === client.id || (t.projectId && projectIds.has(t.projectId)))
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  const meta = statusMeta(client.status)
  const currency = state.prefs.currency

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => onNavigate({ kind: 'clients' })}
        className="hit-40 -ml-1 inline-flex w-fit items-center gap-1.5 rounded-[8px] text-[13px] font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeft size={14} aria-hidden /> All clients
      </button>

      <Panel className="relative overflow-hidden p-5">
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${toneSolid(client.tone)}, ${toneTint(client.tone, 20)})` }} />
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-[14px] text-[18px] font-bold text-white" style={{ background: `linear-gradient(180deg, ${toneTint(client.tone, 82)}, ${toneSolid(client.tone)})` }}>
            {client.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[22px] leading-tight font-semibold text-ink">{client.name}</h2>
              <Pill label={meta.label} tone={meta.tone} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={13} aria-hidden /> {client.contact || 'No contact'}
              </span>
              {client.email && (
                <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 hover:text-ink hover:underline">
                  <Mail size={13} aria-hidden /> {client.email}
                </a>
              )}
              <span>{client.retainer > 0 ? `${money(client.retainer, currency)} / month` : 'No retainer'}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {confirming ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    actions.removeClient(client.id)
                    onNavigate({ kind: 'clients' })
                  }}
                >
                  Delete client
                </Button>
              </>
            ) : (
              <IconButton label="Delete client" onClick={() => setConfirming(true)}>
                <Trash2 size={16} />
              </IconButton>
            )}
          </div>
        </div>
        {client.notes && <p className="mt-3 max-w-[70ch] rounded-[12px] bg-hover px-3 py-2 text-[13.5px] leading-relaxed text-ink-2">{client.notes}</p>}
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open tasks" value={stats.openTasks} hint={`${stats.overdueTasks} overdue`} tone={stats.overdueTasks ? 'rose' : 'inbox'} />
        <StatCard label="Projects" value={stats.projects} hint={`${stats.activeProjects} live`} tone="upcoming" />
        <StatCard label="Logged" value={hoursLabel(stats.loggedMinutes)} hint={`${hoursLabel(stats.weekMinutes)} this week`} tone="teal" />
        <StatCard label="Retainer" value={client.retainer ? money(client.retainer, currency, true) : '—'} hint={client.retainer ? 'per month' : 'project based'} tone="green" />
      </div>

      <Panel className="overflow-hidden">
        <PanelHeading
          title="Projects"
          hint="Every project for this client, live ones first."
          action={
            <button
              type="button"
              onClick={() => onNavigate({ kind: 'projects' })}
              className="hit-40 inline-flex items-center gap-1 rounded-[8px] text-[12.5px] font-semibold text-inbox-ink hover:underline focus-visible:outline-2 focus-visible:outline-inbox"
            >
              Manage <ArrowRight size={13} aria-hidden />
            </button>
          }
        />
        <div className="divide-y divide-line">
          {projects
            .sort((a, b) => Number(a.status === 'archived' || a.status === 'launched') - Number(b.status === 'archived' || b.status === 'launched'))
            .map((project) => {
              const s = projectStats(state, project.id)
              const health = projectHealth(state, project.id)
              const pm = PROJECT_STATUSES.find((x) => x.id === project.status) ?? PROJECT_STATUSES[0]
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onNavigate({ kind: 'project', id: project.id })}
                  className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-hover/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{project.name}</span>
                    <Pill label={pm.label} tone={pm.tone} />
                    <Pill label={health.label} tone={health.tone} dot={false} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <ProgressBar value={s.progress} tone={pm.tone} />
                    <span className="w-[110px] shrink-0 text-right text-[12px] text-muted">
                      {project.due ? dateLabel(project.due) : 'No date'} · {hoursLabel(s.loggedMinutes)}
                    </span>
                  </div>
                </button>
              )
            })}
          {projects.length === 0 && <div className="p-4"><EmptyHint>No projects for this client yet. Add one from the Projects screen.</EmptyHint></div>}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeading title="Work" hint={`${tasks.filter((t) => !t.done).length} open across this account.`} />
        <div className="divide-y divide-line">
          {tasks.map((task) => (
            <TaskLine
              key={task.id}
              task={task}
              project={state.projects.find((p) => p.id === task.projectId)}
              client={client}
              member={state.members.find((m) => m.id === task.assigneeId)}
              onOpen={() => onOpenTask(task.id)}
              onToggle={() => onToggleTask(task)}
            />
          ))}
          {tasks.length === 0 && <div className="p-4"><EmptyHint>No tasks for this client yet.</EmptyHint></div>}
        </div>
      </Panel>

      <ClientFormModal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit ${client.name}`}
        client={client}
        onSave={(patch) => {
          const { name, ...rest } = patch
          actions.updateClient(client.id, { name, ...rest })
          setEditing(false)
          return true
        }}
      />
    </div>
  )
}

type ClientFields = {
  name: string
  status: ClientStatus
  contact: string
  email: string
  retainer: string
  tone: Tone
  notes: string
}

function ClientFormModal({
  open,
  onClose,
  title,
  client,
  onSave,
}: {
  open: boolean
  onClose: () => void
  title: string
  client?: Client
  onSave: (patch: Omit<Client, 'id' | 'createdAt'>) => boolean
}) {
  const [fields, setFields] = useState<ClientFields>(() => ({
    name: client?.name ?? '',
    status: client?.status ?? 'active',
    contact: client?.contact ?? '',
    email: client?.email ?? '',
    retainer: client ? String(client.retainer) : '',
    tone: client?.tone ?? 'teal',
    notes: client?.notes ?? '',
  }))
  const [error, setError] = useState<string | null>(null)

  // Refill the form each time it opens (create after edit, or another client).
  useEffect(() => {
    if (!open) return
    setFields({
      name: client?.name ?? '',
      status: client?.status ?? 'active',
      contact: client?.contact ?? '',
      email: client?.email ?? '',
      retainer: client ? String(client.retainer) : '',
      tone: client?.tone ?? 'teal',
      notes: client?.notes ?? '',
    })
    setError(null)
  }, [open, client])

  const set = <K extends keyof ClientFields>(key: K, value: ClientFields[K]) => {
    setFields((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  const submit = () => {
    const name = fields.name.trim()
    if (!name) return setError('Give the client a name.')
    onSave({
      name,
      status: fields.status,
      contact: fields.contact.trim(),
      email: fields.email.trim(),
      retainer: Math.max(0, Number(fields.retainer) || 0),
      tone: fields.tone,
      notes: fields.notes.trim(),
    })
  }

  return (
    <Modal open={open} onClose={onClose} label={title} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex min-h-0 flex-col"
      >
        <header className="flex items-center justify-between px-5 pt-4 pb-1">
          <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Client name">
                <TextInput autoFocus value={fields.name} onChange={(e) => set('name', e.target.value)} placeholder="Halcyon Coffee" maxLength={80} invalid={!!error && !fields.name.trim()} />
              </Field>
            </div>
            <Field label="Status">
              <Select
                label="Client status"
                value={fields.status}
                onChange={(e) => set('status', e.target.value as ClientStatus)}
                options={CLIENT_STATUSES.map((s) => ({ value: s.id, label: s.label }))}
              />
            </Field>
            <Field label="Monthly retainer">
              <TextInput type="number" min={0} step={100} value={fields.retainer} onChange={(e) => set('retainer', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Contact">
              <TextInput value={fields.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Mara Ellis" maxLength={80} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={fields.email} onChange={(e) => set('email', e.target.value)} placeholder="mara@example.com" maxLength={120} />
            </Field>
          </div>
          <div className="mt-3">
            <span className="text-[13px] font-semibold text-ink-2">Colour</span>
            <div className="mt-1.5">
              <TonePicker value={fields.tone} onChange={(tone) => set('tone', tone)} />
            </div>
          </div>
          <div className="mt-3">
            <Field label="Notes">
              <TextArea rows={3} value={fields.notes} onChange={(e) => set('notes', e.target.value)} placeholder="How you work with them, billing quirks, contacts..." />
            </Field>
          </div>
          {error && (
            <p role="alert" className="mt-2 rounded-[10px] bg-danger/8 px-3 py-2 text-[13px] text-danger-ink">
              {error}
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save client
          </Button>
        </footer>
      </form>
    </Modal>
  )
}
