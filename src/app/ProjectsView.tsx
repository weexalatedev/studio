import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { DueBadge } from '../components/DueBadge'
import { IconButton } from '../components/IconButton'
import { Modal } from '../components/Modal'
import { PriorityFlag } from '../components/PriorityFlag'
import { Select } from '../components/Select'
import { SegmentedControl } from '../components/SegmentedControl'
import { TextArea, TextInput } from '../components/TextField'
import { toneSolid } from '../components/tones'
import { PROJECT_STATUSES, TASK_STATUSES, type ProjectStatus, type TaskStatus } from '../data'
import { projectHealth, projectStats, projectTasks } from '../lib/agency'
import { dateLabel, hoursLabel, money, relativeDue } from '../lib/format'
import { Avatar, EmptyHint, Field, Panel, PanelHeading, Pill, ProgressBar, StatCard } from './agencyUi'
import { TaskLine } from './TaskLine'
import type { Actions, Project, State, Task, View } from './store'

type Props = {
  state: State
  actions: Actions
  view: View
  onNavigate: (view: View) => void
  onOpenTask: (id: string) => void
  onToggleTask: (task: Task) => void
}

const meta = (id: ProjectStatus) => PROJECT_STATUSES.find((s) => s.id === id) ?? PROJECT_STATUSES[0]
const COLUMNS: { id: 'todo' | 'doing' | 'review' | 'done'; label: string; tone: string }[] = [
  ...TASK_STATUSES.map((s) => ({ id: s.id, label: s.label, tone: s.tone })),
  { id: 'done', label: 'Done', tone: 'green' },
]

export function ProjectsView({ state, actions, view, onNavigate, onOpenTask, onToggleTask }: Props) {
  if (view.kind === 'project') {
    const project = state.projects.find((p) => p.id === view.id)
    if (!project) {
      return (
        <div>
          <EmptyHint>That project no longer exists.</EmptyHint>
          <Button className="mt-3" variant="secondary" onClick={() => onNavigate({ kind: 'projects' })}>
            <ArrowLeft size={15} /> All projects
          </Button>
        </div>
      )
    }
    return (
      <ProjectDetail
        project={project}
        state={state}
        actions={actions}
        onNavigate={onNavigate}
        onOpenTask={onOpenTask}
        onToggleTask={onToggleTask}
      />
    )
  }
  return <ProjectList state={state} actions={actions} onNavigate={onNavigate} />
}

function ProjectList({ state, actions, onNavigate }: Pick<Props, 'state' | 'actions' | 'onNavigate'>) {
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all')
  const currency = state.prefs.currency
  const visible = state.projects
    .filter((p) => filter === 'all' || p.status === filter)
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {PROJECT_STATUSES.map((s) => {
          const count = state.projects.filter((p) => p.status === s.id).length
          const active = filter === s.id
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(active ? 'all' : s.id)}
              className={`hit-40 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors ${
                active ? 'bg-white text-ink shadow-[var(--shadow-row)]' : 'bg-white/45 text-ink-2 hover:bg-white/70'
              }`}
            >
              <span className="size-2 rounded-full" style={{ background: toneSolid(s.tone) }} aria-hidden />
              {s.label}
              <span className="text-[11.5px] tabular-nums text-muted">{count}</span>
            </button>
          )
        })}
        <Button className="ml-auto !rounded-full" variant="primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> New project
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((project) => {
          const stats = projectStats(state, project.id)
          const health = projectHealth(state, project.id)
          const m = meta(project.status)
          const client = state.clients.find((c) => c.id === project.clientId)
          const people = [...new Set(projectTasks(state, project.id).map((t) => t.assigneeId).filter((x): x is string => !!x))].slice(0, 3)
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onNavigate({ kind: 'project', id: project.id })}
              className="group flex flex-col rounded-[20px] bg-white p-4 text-left shadow-[var(--shadow-row)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgb(16_24_40/0.08),0_16px_30px_-16px_rgb(16_24_40/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-muted uppercase">{client?.name ?? 'No client'}</p>
                  <h3 className="mt-0.5 truncate text-[16px] font-semibold text-ink">{project.name}</h3>
                </div>
                <Pill label={m.label} tone={m.tone} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Pill label={health.label} tone={health.tone} />
                <span className="text-[12px] text-muted">{relativeDue(project.due)}</span>
                <span className="ml-auto flex items-center gap-1">
                  {people.map((id) => (
                    <Avatar key={id} member={state.members.find((x) => x.id === id)} size={20} />
                  ))}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={stats.progress} tone={m.tone} />
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-muted">
                  <span className="tabular-nums">
                    {stats.doneTasks}/{stats.totalTasks} tasks
                  </span>
                  <span className="tabular-nums">
                    {hoursLabel(stats.loggedMinutes)} / {money(project.budget, currency, true)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {visible.length === 0 && <EmptyHint>No projects in this filter. Create one to get started.</EmptyHint>}

      <ProjectFormModal
        state={state}
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(clientId, patch) => {
          actions.addProject(clientId, patch.name, patch)
          setCreating(false)
          return true
        }}
      />
    </div>
  )
}

function ProjectDetail({
  project,
  state,
  actions,
  onNavigate,
  onOpenTask,
  onToggleTask,
}: Pick<Props, 'state' | 'actions' | 'onNavigate' | 'onOpenTask' | 'onToggleTask'> & { project: Project }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [mode, setMode] = useState<'list' | 'board'>('list')
  const [title, setTitle] = useState('')
  const stats = projectStats(state, project.id)
  const health = projectHealth(state, project.id)
  const m = meta(project.status)
  const client = state.clients.find((c) => c.id === project.clientId)
  const tasks = projectTasks(state, project.id).sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999'),
  )
  const currency = state.prefs.currency
  const value = Math.round(stats.value)

  const addTask = () => {
    const t = title.trim()
    if (!t) return
    actions.addTask(t, { projectId: project.id, clientId: project.clientId })
    setTitle('')
  }

  const move = (task: Task, dir: -1 | 1) => {
    const order = COLUMNS.map((c) => c.id)
    const current = task.done ? 'done' : task.status
    const next = order[Math.max(0, Math.min(order.length - 1, order.indexOf(current) + dir))]
    if (next === 'done') actions.updateTask(task.id, { done: true, completedAt: Date.now(), status: 'review' })
    else actions.updateTask(task.id, { done: false, completedAt: null, status: next as TaskStatus })
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => onNavigate({ kind: 'projects' })}
        className="hit-40 -ml-1 inline-flex w-fit items-center gap-1.5 rounded-[8px] text-[13px] font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeft size={14} aria-hidden /> All projects
      </button>

      <Panel className="p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => client && onNavigate({ kind: 'client', id: client.id })}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.02em] text-muted uppercase hover:text-inbox-ink hover:underline"
            >
              <span className="size-2 rounded-full" style={{ background: toneSolid(client?.tone ?? 'slate') }} />
              {client?.name ?? 'No client'}
            </button>
            <h2 className="mt-1 text-[24px] leading-tight font-semibold text-ink">{project.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill label={m.label} tone={m.tone} />
              <Pill label={health.label} tone={health.tone} />
              <span className="text-[12.5px] text-muted">{project.due ? `Due ${dateLabel(project.due)} · ${relativeDue(project.due)}` : 'No deadline'}</span>
            </div>
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
                    actions.removeProject(project.id)
                    onNavigate({ kind: 'projects' })
                  }}
                >
                  Delete project
                </Button>
              </>
            ) : (
              <IconButton label="Delete project" onClick={() => setConfirming(true)}>
                <Trash2 size={16} />
              </IconButton>
            )}
          </div>
        </div>
        {project.notes && <p className="mt-3 max-w-[75ch] rounded-[12px] bg-hover px-3 py-2 text-[13.5px] leading-relaxed text-ink-2">{project.notes}</p>}
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Progress" value={`${stats.progress}%`} hint={`${stats.doneTasks} of ${stats.totalTasks} tasks done`} tone={m.tone} />
        <StatCard label="Time" value={hoursLabel(stats.loggedMinutes)} hint={`${hoursLabel(stats.estimateMinutes)} estimated · ${hoursLabel(stats.weekMinutes)} this week`} tone="teal" />
        <StatCard label="Budget used" value={`${stats.budgetUsed}%`} hint={`${money(value, currency)} of ${money(project.budget, currency, true)}`} tone={stats.budgetUsed > 100 ? 'rose' : 'green'} />
        <StatCard label="Rate" value={money(project.rate || state.prefs.defaultRate, currency)} hint="per hour" tone="upcoming" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <SegmentedControl
          label="Task layout"
          variant="frost"
          clearable={false}
          value={mode}
          onChange={(v) => v && setMode(v)}
          options={[
            { id: 'list', label: 'List' },
            { id: 'board', label: 'Board' },
          ]}
          className="w-[190px]"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addTask()
          }}
          className="frost flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-full pr-1 pl-3 sm:max-w-[360px]"
        >
          <Plus size={16} className="shrink-0 text-ink-2" aria-hidden />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task to this project..."
            aria-label="New task title"
            maxLength={200}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-[#8f949b]"
          />
          <Button type="submit" size="sm" variant="primary" className="!h-7 shrink-0 !rounded-full !px-2.5 !text-[12px]">
            Add
          </Button>
        </form>
      </div>

      {mode === 'list' ? (
        <Panel className="overflow-hidden">
          <PanelHeading title="Tasks" hint="Open work first, then the finished rows." />
          <div className="divide-y divide-line">
            {tasks.map((task) => (
              <TaskLine
                key={task.id}
                task={task}
                project={project}
                client={client}
                member={state.members.find((x) => x.id === task.assigneeId)}
                showProject={false}
                onOpen={() => onOpenTask(task.id)}
                onToggle={() => onToggleTask(task)}
              />
            ))}
            {tasks.length === 0 && <div className="p-4"><EmptyHint>No tasks yet. Add one above, then open it to set an assignee and estimate.</EmptyHint></div>}
          </div>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => (col.id === 'done' ? t.done : !t.done && t.status === col.id))
            return (
              <section key={col.id} aria-label={col.label} className="flex min-w-0 flex-col rounded-[18px] bg-white/60 p-2 shadow-[var(--shadow-row)] backdrop-blur-sm">
                <h3 className="flex items-center gap-1.5 px-1.5 py-1.5 text-[12px] font-semibold text-ink-2">
                  <span className="size-2 rounded-full" style={{ background: `var(--color-${col.tone})` }} aria-hidden />
                  {col.label}
                  <span className="ml-auto tabular-nums text-muted">{items.length}</span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {items.map((task) => {
                    const index = COLUMNS.findIndex((c) => c.id === col.id)
                    return (
                      <li key={task.id} className="rounded-[14px] bg-white p-2.5 shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
                        <button
                          type="button"
                          onClick={() => onOpenTask(task.id)}
                          className="block w-full text-left text-[13.5px] leading-snug text-ink outline-none focus-visible:underline"
                        >
                          {task.title}
                        </button>
                        <div className="mt-2 flex items-center gap-1.5">
                          <PriorityFlag priority={task.priority} />
                          {task.due && <DueBadge due={task.due} done={task.done} />}
                          <span className="ml-auto flex items-center gap-0.5">
                            <Avatar member={state.members.find((x) => x.id === task.assigneeId)} size={20} />
                            {index > 0 && (
                              <IconButton size="sm" label={`Move “${task.title}” back`} onClick={() => move(task, -1)}>
                                <ChevronLeft size={14} />
                              </IconButton>
                            )}
                            {index < COLUMNS.length - 1 && (
                              <IconButton size="sm" label={`Move “${task.title}” forward`} onClick={() => move(task, 1)}>
                                <ChevronRight size={14} />
                              </IconButton>
                            )}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                  {items.length === 0 && <li className="px-1.5 py-2 text-[12px] text-muted">Nothing here.</li>}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <ProjectFormModal
        state={state}
        project={project}
        open={editing}
        onClose={() => setEditing(false)}
        onSave={(clientId, patch) => {
          actions.updateProject(project.id, { ...patch, clientId })
          setEditing(false)
          return true
        }}
      />
    </div>
  )
}

type ProjectFields = {
  name: string
  clientId: string
  status: ProjectStatus
  due: string
  budget: string
  rate: string
  notes: string
}

function ProjectFormModal({
  state,
  open,
  onClose,
  project,
  onSave,
}: {
  state: State
  open: boolean
  onClose: () => void
  project?: Project
  onSave: (clientId: string, patch: Omit<Project, 'id' | 'createdAt' | 'order' | 'clientId'>) => boolean
}) {
  const [fields, setFields] = useState<ProjectFields>(() => ({
    name: project?.name ?? '',
    clientId: project?.clientId ?? state.clients[0]?.id ?? '',
    status: project?.status ?? 'lead',
    due: project?.due ?? '',
    budget: project ? String(project.budget) : '',
    rate: project ? String(project.rate) : '',
    notes: project?.notes ?? '',
  }))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFields({
      name: project?.name ?? '',
      clientId: project?.clientId ?? state.clients[0]?.id ?? '',
      status: project?.status ?? 'lead',
      due: project?.due ?? '',
      budget: project ? String(project.budget) : '',
      rate: project ? String(project.rate) : '',
      notes: project?.notes ?? '',
    })
    setError(null)
  }, [open, project, state.clients])

  const set = <K extends keyof ProjectFields>(key: K, value: ProjectFields[K]) => {
    setFields((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  const submit = () => {
    const name = fields.name.trim()
    if (!name) return setError('Give the project a name.')
    if (!fields.clientId) return setError('Add a client first, then attach the project to it.')
    onSave(fields.clientId, {
      name,
      status: fields.status,
      due: fields.due || null,
      budget: Math.max(0, Number(fields.budget) || 0),
      rate: Math.max(0, Number(fields.rate) || 0),
      notes: fields.notes.trim(),
    })
  }

  return (
    <Modal open={open} onClose={onClose} label={project ? 'Edit project' : 'New project'} width={540}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex min-h-0 flex-col"
      >
        <header className="px-5 pt-4 pb-1">
          <h2 className="text-[18px] font-semibold text-ink">{project ? 'Edit project' : 'New project'}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">Budget and rate price the hours you log against it.</p>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Project name">
                <TextInput autoFocus value={fields.name} onChange={(e) => set('name', e.target.value)} placeholder="Halcyon rebrand" maxLength={80} />
              </Field>
            </div>
            <Field label="Client">
              <Select
                label="Client"
                value={fields.clientId}
                onChange={(e) => set('clientId', e.target.value)}
                options={state.clients.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <Field label="Stage">
              <Select
                label="Stage"
                value={fields.status}
                onChange={(e) => set('status', e.target.value as ProjectStatus)}
                options={PROJECT_STATUSES.map((s) => ({ value: s.id, label: s.label }))}
              />
            </Field>
            <Field label="Deadline">
              <TextInput type="date" value={fields.due} onChange={(e) => set('due', e.target.value)} />
            </Field>
            <Field label="Budget">
              <TextInput type="number" min={0} step={500} value={fields.budget} onChange={(e) => set('budget', e.target.value)} placeholder="18000" />
            </Field>
            <Field label="Hourly rate" hint="Used to price logged time.">
              <TextInput type="number" min={0} step={5} value={fields.rate} onChange={(e) => set('rate', e.target.value)} placeholder={String(state.prefs.defaultRate)} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Notes">
              <TextArea rows={3} value={fields.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Scope, deliverables, links..." />
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
            Save project
          </Button>
        </footer>
      </form>
    </Modal>
  )
}
