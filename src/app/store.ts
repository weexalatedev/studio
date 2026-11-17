import { useEffect, useMemo, useReducer } from 'react'

import {
  APP_NAME,
  CLIENT_STATUSES,
  CURRENCIES,
  LEGACY_STORAGE_KEYS,
  LIST_ICON_IDS,
  LIST_TONES,
  MEMBER_TONES,
  PROJECT_STATUSES,
  SCENES,
  SEED_CLIENTS,
  SEED_LISTS,
  SEED_MEMBERS,
  SEED_PROJECTS,
  SEED_TAGS,
  SEED_TASKS,
  SEED_TIME,
  STORAGE_KEY,
  type ClientStatus,
  type Currency,
  type ListIconId,
  type Priority,
  type ProjectStatus,
  type SceneId,
  type SmartListId,
  type TaskStatus,
  type Tone,
} from '../data'
import { addDays, addInterval, bucketOf, daysFromToday, todayKey, type RepeatUnit } from '../lib/dates'

export type Subtask = { id: string; title: string; done: boolean }

/** Repeat every `every` days, weeks or months. Daily = { 1, 'day' }. */
export type Repeat = { every: number; unit: RepeatUnit }

export type Task = {
  id: string
  title: string
  notes: string
  done: boolean
  starred: boolean
  /** Local calendar day `YYYY-MM-DD`, or null for no date. */
  due: string | null
  /** User list id, or null for the Inbox. */
  listId: string | null
  clientId: string | null
  projectId: string | null
  /** Team member id. */
  assigneeId: string | null
  priority: Priority
  /** Where the task sits on a project board. */
  status: TaskStatus
  /** Estimated hours. */
  estimate: number
  billable: boolean
  /** Tag ids. */
  tags: string[]
  subtasks: Subtask[]
  repeat: Repeat | null
  /** Manual sort key inside a date group (drag to reorder). */
  order: number
  /** For a completed repeating task: the id of the next occurrence it created. */
  nextId: string | null
  createdAt: number
  completedAt: number | null
}

export type TaskList = { id: string; name: string; tone: Tone; icon: ListIconId }
export type Tag = { id: string; name: string; tone: Tone }

export type Client = {
  id: string
  name: string
  tone: Tone
  status: ClientStatus
  contact: string
  email: string
  /** Monthly retainer in the studio currency, 0 for none. */
  retainer: number
  notes: string
  createdAt: number
}

export type Project = {
  id: string
  clientId: string
  name: string
  status: ProjectStatus
  due: string | null
  /** Fixed fee or agreed budget. */
  budget: number
  /** Hourly rate used to price logged time. */
  rate: number
  notes: string
  order: number
  createdAt: number
}

export type Member = {
  id: string
  name: string
  role: string
  tone: Tone
  /** Hours a week this person can be booked. */
  capacity: number
  rate: number
  createdAt: number
}

export type TimeEntry = {
  id: string
  taskId: string | null
  projectId: string | null
  memberId: string | null
  /** Local calendar day `YYYY-MM-DD`. */
  date: string
  minutes: number
  note: string
  billable: boolean
  createdAt: number
}

export type Prefs = {
  scene: SceneId
  agencyName: string
  currency: Currency
  /** Fallback hourly rate when a project has none. */
  defaultRate: number
}

/** What the main area shows. */
export type View =
  | { kind: 'smart'; id: SmartListId }
  | { kind: 'list'; id: string }
  | { kind: 'overview' }
  | { kind: 'clients' }
  | { kind: 'client'; id: string }
  | { kind: 'projects' }
  | { kind: 'project'; id: string }
  | { kind: 'team' }
  | { kind: 'time' }

export type State = {
  tasks: Task[]
  lists: TaskList[]
  tags: Tag[]
  clients: Client[]
  projects: Project[]
  members: Member[]
  time: TimeEntry[]
  prefs: Prefs
}

type Action =
  | { type: 'add'; task: Task }
  | { type: 'update'; id: string; patch: Partial<Task> }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'removeMany'; ids: string[] }
  | { type: 'restore'; tasks: Task[] }
  | { type: 'addList'; list: TaskList }
  | { type: 'updateList'; id: string; patch: Partial<TaskList> }
  | { type: 'removeList'; id: string }
  | { type: 'addTag'; tag: Tag }
  | { type: 'updateTag'; id: string; patch: Partial<Tag> }
  | { type: 'removeTag'; id: string }
  | { type: 'addClient'; client: Client }
  | { type: 'updateClient'; id: string; patch: Partial<Client> }
  | { type: 'removeClient'; id: string }
  | { type: 'addProject'; project: Project }
  | { type: 'updateProject'; id: string; patch: Partial<Project> }
  | { type: 'removeProject'; id: string }
  | { type: 'addMember'; member: Member }
  | { type: 'updateMember'; id: string; patch: Partial<Member> }
  | { type: 'removeMember'; id: string }
  | { type: 'addTime'; entry: TimeEntry }
  | { type: 'removeTime'; id: string }
  | { type: 'prefs'; patch: Partial<Prefs> }
  | { type: 'replace'; state: State }

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const TONE_SET = new Set<Tone>(['inbox', 'today', 'upcoming', 'starred', 'teal', 'rose', 'green', 'slate'])
const SCENE_SET = new Set<SceneId>(SCENES.map((s) => s.id))
const CLIENT_STATUS_SET = new Set<ClientStatus>(CLIENT_STATUSES.map((s) => s.id))
const PROJECT_STATUS_SET = new Set<ProjectStatus>(PROJECT_STATUSES.map((s) => s.id))
const TASK_STATUS_SET = new Set<TaskStatus>(['todo', 'doing', 'review'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function newTask(title: string, defaults: Partial<Task> = {}): Task {
  const now = Date.now()
  return {
    id: uid(),
    title,
    notes: '',
    done: false,
    starred: false,
    due: null,
    listId: null,
    clientId: null,
    projectId: null,
    assigneeId: null,
    priority: 0,
    status: 'todo',
    estimate: 0,
    billable: true,
    tags: [],
    subtasks: [],
    repeat: null,
    order: now,
    nextId: null,
    createdAt: now,
    completedAt: null,
    ...defaults,
  }
}

export function seedState(): State {
  const now = Date.now()
  const listIds = new Map(SEED_LISTS.map((l) => [l.key, `ls-${l.key}`]))
  const tagIds = new Map(SEED_TAGS.map((t) => [t.key, `tg-${t.key}`]))
  const lists: TaskList[] = SEED_LISTS.map((l) => ({ id: `ls-${l.key}`, name: l.name, tone: l.tone, icon: l.icon }))
  const tags: Tag[] = SEED_TAGS.map((t) => ({ id: `tg-${t.key}`, name: t.name, tone: t.tone }))
  const clients: Client[] = SEED_CLIENTS.map((c, i) => ({ ...c, createdAt: now + i }))
  const projects: Project[] = SEED_PROJECTS.map((p, i) => ({
    id: p.id,
    clientId: p.clientId,
    name: p.name,
    status: p.status,
    due: p.dueInDays === null ? null : addDays(todayKey(), p.dueInDays),
    budget: p.budget,
    rate: p.rate,
    notes: p.notes,
    order: now + i,
    createdAt: now + i,
  }))
  const members: Member[] = SEED_MEMBERS.map((m, i) => ({ ...m, createdAt: now + i }))
  const tasks: Task[] = SEED_TASKS.map((t, i) =>
    newTask(t.title, {
      notes: t.notes,
      starred: t.starred,
      clientId: t.clientId,
      projectId: t.projectId,
      assigneeId: t.assigneeId,
      due: t.dueInDays === null ? null : addDays(todayKey(), t.dueInDays),
      priority: t.priority,
      status: t.status,
      estimate: t.estimate,
      billable: t.billable,
      tags: t.tags.map((k) => tagIds.get(k)).filter((x): x is string => !!x),
      listId: t.listKey ? (listIds.get(t.listKey) ?? null) : null,
      order: now + i,
      createdAt: now + i,
      done: t.doneDaysAgo !== undefined,
      completedAt: t.doneDaysAgo === undefined ? null : now - t.doneDaysAgo * 86_400_000,
    }),
  )
  // Keep the demo entries inside the current week (Monday first), so the
  // dashboard and timesheet have this week's hours even on a Monday.
  const today = todayKey()
  const weekStart = addDays(today, -((new Date().getDay() + 6) % 7))
  const withinWeek = (key: string) => (key < weekStart ? weekStart : key)
  const time: TimeEntry[] = SEED_TIME.map((e, i) => {
    const task = tasks[e.taskIndex]
    return {
      id: `te-seed-${i}`,
      taskId: task?.id ?? null,
      projectId: task?.projectId ?? null,
      memberId: e.memberId,
      date: withinWeek(addDays(today, -e.daysAgo)),
      minutes: e.minutes,
      note: e.note,
      billable: task?.billable ?? true,
      createdAt: now + i,
    }
  })
  return {
    tasks,
    lists,
    tags,
    clients,
    projects,
    members,
    time,
    prefs: { scene: SCENES[0].id, agencyName: 'Northlight Studio', currency: 'USD', defaultRate: 120 },
  }
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function normalizeTask(raw: unknown, i: number): Task | null {
  const t = obj(raw)
  const title = str(t.title).trim()
  if (!title) return null
  const createdAt = num(t.createdAt, Date.now() + i)
  const repeat = obj(t.repeat)
  const unit = repeat.unit
  return {
    id: str(t.id) || uid(),
    title: title.slice(0, 200),
    notes: str(t.notes),
    done: t.done === true,
    starred: t.starred === true,
    due: typeof t.due === 'string' && DATE_RE.test(t.due) ? t.due : null,
    listId: typeof t.listId === 'string' ? t.listId : null,
    clientId: typeof t.clientId === 'string' ? t.clientId : null,
    projectId: typeof t.projectId === 'string' ? t.projectId : null,
    assigneeId: typeof t.assigneeId === 'string' ? t.assigneeId : null,
    priority: ([0, 1, 2, 3].includes(t.priority as number) ? t.priority : 0) as Priority,
    status: TASK_STATUS_SET.has(t.status as TaskStatus) ? (t.status as TaskStatus) : 'todo',
    estimate: Math.max(0, Math.min(1000, num(t.estimate, 0))),
    billable: t.billable !== false,
    tags: Array.isArray(t.tags) ? t.tags.filter((x): x is string => typeof x === 'string') : [],
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks
          .map((s) => obj(s))
          .filter((s) => str(s.title).trim())
          .map((s) => ({ id: str(s.id) || uid(), title: str(s.title).trim(), done: s.done === true }))
      : [],
    repeat:
      unit === 'day' || unit === 'week' || unit === 'month'
        ? { unit, every: Math.min(365, Math.max(1, Math.round(num(repeat.every, 1)))) }
        : null,
    order: num(t.order, createdAt),
    nextId: typeof t.nextId === 'string' ? t.nextId : null,
    createdAt,
    completedAt: t.done === true ? num(t.completedAt, Date.now()) : null,
  }
}

/**
 * Turn anything (a saved state, an older version, an imported file) into a
 * valid State. Throws when it does not look like Studio data at all.
 */
export function normalizeState(raw: unknown): State {
  const s = obj(raw)
  if (!Array.isArray(s.tasks) || !Array.isArray(s.lists)) throw new Error('Not a Studio export: missing tasks or lists.')
  const lists: TaskList[] = s.lists
    .map((x) => obj(x))
    .filter((l) => str(l.id) && str(l.name).trim())
    .map((l, i) => ({
      id: str(l.id),
      name: str(l.name).trim().slice(0, 40),
      tone: TONE_SET.has(l.tone as Tone) ? (l.tone as Tone) : LIST_TONES[i % LIST_TONES.length],
      icon: (LIST_ICON_IDS as readonly string[]).includes(l.icon as string) ? (l.icon as ListIconId) : 'list',
    }))
  const tags: Tag[] = list(s.tags)
    .map((x) => obj(x))
    .filter((t) => str(t.id) && str(t.name).trim())
    .map((t, i) => ({
      id: str(t.id),
      name: str(t.name).trim().slice(0, 24),
      tone: TONE_SET.has(t.tone as Tone) ? (t.tone as Tone) : LIST_TONES[i % LIST_TONES.length],
    }))

  const clients: Client[] = list(s.clients)
    .map((x) => obj(x))
    .filter((c) => str(c.id) && str(c.name).trim())
    .map((c, i) => ({
      id: str(c.id),
      name: str(c.name).trim().slice(0, 80),
      tone: TONE_SET.has(c.tone as Tone) ? (c.tone as Tone) : LIST_TONES[i % LIST_TONES.length],
      status: CLIENT_STATUS_SET.has(c.status as ClientStatus) ? (c.status as ClientStatus) : 'active',
      contact: str(c.contact).slice(0, 80),
      email: str(c.email).slice(0, 120),
      retainer: Math.max(0, num(c.retainer, 0)),
      notes: str(c.notes),
      createdAt: num(c.createdAt, Date.now() + i),
    }))
  const clientIds = new Set(clients.map((c) => c.id))

  const projects: Project[] = list(s.projects)
    .map((x) => obj(x))
    .filter((p) => str(p.id) && str(p.name).trim() && clientIds.has(str(p.clientId)))
    .map((p, i) => ({
      id: str(p.id),
      clientId: str(p.clientId),
      name: str(p.name).trim().slice(0, 80),
      status: PROJECT_STATUS_SET.has(p.status as ProjectStatus) ? (p.status as ProjectStatus) : 'lead',
      due: typeof p.due === 'string' && DATE_RE.test(p.due) ? p.due : null,
      budget: Math.max(0, num(p.budget, 0)),
      rate: Math.max(0, num(p.rate, 0)),
      notes: str(p.notes),
      order: num(p.order, i),
      createdAt: num(p.createdAt, Date.now() + i),
    }))
  const projectIds = new Set(projects.map((p) => p.id))

  const members: Member[] = list(s.members)
    .map((x) => obj(x))
    .filter((m) => str(m.id) && str(m.name).trim())
    .map((m, i) => ({
      id: str(m.id),
      name: str(m.name).trim().slice(0, 60),
      role: str(m.role).slice(0, 60),
      tone: TONE_SET.has(m.tone as Tone) ? (m.tone as Tone) : MEMBER_TONES[i % MEMBER_TONES.length],
      capacity: Math.min(80, Math.max(0, num(m.capacity, 32))),
      rate: Math.max(0, num(m.rate, 0)),
      createdAt: num(m.createdAt, Date.now() + i),
    }))
  const memberIds = new Set(members.map((m) => m.id))

  const listIds = new Set(lists.map((l) => l.id))
  const tagIds = new Set(tags.map((t) => t.id))
  const tasks = list(s.tasks)
    .map(normalizeTask)
    .filter((t): t is Task => t !== null)
    .map((t) => {
      const project = t.projectId ? projects.find((p) => p.id === t.projectId) : null
      return {
        ...t,
        listId: t.listId && listIds.has(t.listId) ? t.listId : null,
        projectId: t.projectId && projectIds.has(t.projectId) ? t.projectId : null,
        clientId: t.clientId && clientIds.has(t.clientId) ? t.clientId : (project?.clientId ?? null),
        assigneeId: t.assigneeId && memberIds.has(t.assigneeId) ? t.assigneeId : null,
        tags: t.tags.filter((id) => tagIds.has(id)),
      }
    })

  const time: TimeEntry[] = list(s.time)
    .map((x) => obj(x))
    .filter((e) => str(e.id) && num(e.minutes, 0) > 0)
    .map((e, i) => {
      const taskId = str(e.taskId) || null
      const task = taskId ? tasks.find((t) => t.id === taskId) : null
      return {
        id: str(e.id),
        taskId: task?.id ?? null,
        projectId: str(e.projectId) && projectIds.has(str(e.projectId)) ? str(e.projectId) : (task?.projectId ?? null),
        memberId: str(e.memberId) && memberIds.has(str(e.memberId)) ? str(e.memberId) : null,
        date: typeof e.date === 'string' && DATE_RE.test(e.date) ? e.date : todayKey(),
        minutes: Math.max(1, Math.min(24 * 60, Math.round(num(e.minutes, 0)))),
        note: str(e.note).slice(0, 300),
        billable: e.billable !== false,
        createdAt: num(e.createdAt, Date.now() + i),
      }
    })

  const p = obj(s.prefs)
  return {
    tasks,
    lists,
    tags,
    clients,
    projects,
    members,
    time,
    prefs: {
      scene: SCENE_SET.has(p.scene as SceneId) ? (p.scene as SceneId) : SCENES[0].id,
      agencyName: str(p.agencyName, 'Northlight Studio').slice(0, 60) || APP_NAME,
      currency: (CURRENCIES as readonly string[]).includes(p.currency as string) ? (p.currency as Currency) : 'USD',
      defaultRate: Math.max(0, num(p.defaultRate, 120)),
    },
  }
}

function load(): State {
  try {
    const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) return normalizeState(JSON.parse(raw))
    }
    return seedState()
  } catch {
    return seedState()
  }
}

/** The due date of the next occurrence: one step on, then onwards until it is in the future. */
export function nextDue(task: Task): string {
  const r = task.repeat!
  let next = addInterval(task.due ?? todayKey(), r.every, r.unit)
  let guard = 0
  while (daysFromToday(next) <= 0 && guard++ < 1000) next = addInterval(next, r.every, r.unit)
  return next
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, tasks: [...state.tasks, action.task] }
    case 'update':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }
    case 'toggle': {
      const task = state.tasks.find((t) => t.id === action.id)
      if (!task) return state
      if (task.done) {
        // Un-completing a repeating task takes back the occurrence it spawned (if untouched).
        const spawned = task.nextId ? state.tasks.find((t) => t.id === task.nextId) : null
        const drop = spawned && !spawned.done ? spawned.id : null
        return {
          ...state,
          tasks: state.tasks
            .filter((t) => t.id !== drop)
            .map((t) => (t.id === task.id ? { ...t, done: false, completedAt: null, nextId: null } : t)),
        }
      }
      const now = Date.now()
      if (task.repeat) {
        const next = newTask(task.title, {
          notes: task.notes,
          starred: task.starred,
          listId: task.listId,
          clientId: task.clientId,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          priority: task.priority,
          status: 'todo',
          estimate: task.estimate,
          billable: task.billable,
          tags: task.tags,
          repeat: task.repeat,
          subtasks: task.subtasks.map((s) => ({ ...s, id: uid(), done: false })),
          due: nextDue(task),
          order: task.order,
        })
        return {
          ...state,
          tasks: [
            ...state.tasks.map((t) => (t.id === task.id ? { ...t, done: true, completedAt: now, nextId: next.id } : t)),
            next,
          ],
        }
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === task.id ? { ...t, done: true, completedAt: now } : t)),
      }
    }
    case 'remove':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'removeMany': {
      const ids = new Set(action.ids)
      return { ...state, tasks: state.tasks.filter((t) => !ids.has(t.id)) }
    }
    case 'restore': {
      const have = new Set(state.tasks.map((t) => t.id))
      return { ...state, tasks: [...state.tasks, ...action.tasks.filter((t) => !have.has(t.id))] }
    }
    case 'addList':
      return { ...state, lists: [...state.lists, action.list] }
    case 'updateList':
      return {
        ...state,
        lists: state.lists.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),
      }
    case 'removeList':
      return {
        ...state,
        lists: state.lists.filter((l) => l.id !== action.id),
        tasks: state.tasks.map((t) => (t.listId === action.id ? { ...t, listId: null } : t)),
      }
    case 'addTag':
      return { ...state, tags: [...state.tags, action.tag] }
    case 'updateTag':
      return { ...state, tags: state.tags.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) }
    case 'removeTag':
      return {
        ...state,
        tags: state.tags.filter((t) => t.id !== action.id),
        tasks: state.tasks.map((t) => (t.tags.includes(action.id) ? { ...t, tags: t.tags.filter((x) => x !== action.id) } : t)),
      }
    case 'addClient':
      return { ...state, clients: [...state.clients, action.client] }
    case 'updateClient':
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      }
    case 'removeClient': {
      const projectIds = new Set(state.projects.filter((p) => p.clientId === action.id).map((p) => p.id))
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.id),
        projects: state.projects.filter((p) => p.clientId !== action.id),
        tasks: state.tasks.map((t) =>
          t.clientId === action.id || (t.projectId && projectIds.has(t.projectId))
            ? { ...t, clientId: null, projectId: null }
            : t,
        ),
        time: state.time.map((e) => (e.projectId && projectIds.has(e.projectId) ? { ...e, projectId: null } : e)),
      }
    }
    case 'addProject':
      return { ...state, projects: [...state.projects, action.project] }
    case 'updateProject':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
        // Keeping the client on the project in sync with its tasks.
        tasks:
          action.patch.clientId !== undefined
            ? state.tasks.map((t) => (t.projectId === action.id ? { ...t, clientId: action.patch.clientId ?? null } : t))
            : state.tasks,
      }
    case 'removeProject':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        tasks: state.tasks.map((t) => (t.projectId === action.id ? { ...t, projectId: null } : t)),
        time: state.time.map((e) => (e.projectId === action.id ? { ...e, projectId: null } : e)),
      }
    case 'addMember':
      return { ...state, members: [...state.members, action.member] }
    case 'updateMember':
      return {
        ...state,
        members: state.members.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      }
    case 'removeMember':
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.id),
        tasks: state.tasks.map((t) => (t.assigneeId === action.id ? { ...t, assigneeId: null } : t)),
        time: state.time.map((e) => (e.memberId === action.id ? { ...e, memberId: null } : e)),
      }
    case 'addTime':
      return { ...state, time: [...state.time, action.entry] }
    case 'removeTime':
      return { ...state, time: state.time.filter((e) => e.id !== action.id) }
    case 'prefs':
      return { ...state, prefs: { ...state.prefs, ...action.patch } }
    case 'replace':
      return action.state
  }
}

/** Does `task` belong in `view`, ignoring completion? Only task views match. */
export function inView(task: Task, view: View): boolean {
  if (view.kind === 'list') return task.listId === view.id
  if (view.kind === 'project') return task.projectId === view.id
  if (view.kind === 'client') return task.clientId === view.id
  if (view.kind !== 'smart') return false
  switch (view.id) {
    case 'inbox':
      return task.listId === null
    case 'today':
      return task.due !== null && daysFromToday(task.due) <= 0
    case 'upcoming':
      return task.due !== null && daysFromToday(task.due) > 0
    case 'starred':
      return task.starred
    case 'completed':
      return task.done
  }
}

/** Task views show rows, filters and the add bar; the rest are studio screens. */
export function isTaskView(view: View): boolean {
  return view.kind === 'smart' || view.kind === 'list'
}

export function useStudio() {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [state])

  const actions = useMemo(
    () => ({
      addTask(title: string, defaults: Partial<Task>) {
        const task = newTask(title, defaults)
        dispatch({ type: 'add', task })
        return task
      },
      updateTask: (id: string, patch: Partial<Task>) => dispatch({ type: 'update', id, patch }),
      toggleTask: (id: string) => dispatch({ type: 'toggle', id }),
      removeTask: (id: string) => dispatch({ type: 'remove', id }),
      removeTasks: (ids: string[]) => dispatch({ type: 'removeMany', ids }),
      restoreTasks: (tasks: Task[]) => dispatch({ type: 'restore', tasks }),
      addList(name: string, index: number) {
        const list: TaskList = { id: uid(), name, tone: LIST_TONES[index % LIST_TONES.length], icon: 'list' }
        dispatch({ type: 'addList', list })
        return list
      },
      updateList: (id: string, patch: Partial<TaskList>) => dispatch({ type: 'updateList', id, patch }),
      removeList: (id: string) => dispatch({ type: 'removeList', id }),
      addTag(name: string, index: number) {
        const tag: Tag = { id: uid(), name, tone: LIST_TONES[index % LIST_TONES.length] }
        dispatch({ type: 'addTag', tag })
        return tag
      },
      updateTag: (id: string, patch: Partial<Tag>) => dispatch({ type: 'updateTag', id, patch }),
      removeTag: (id: string) => dispatch({ type: 'removeTag', id }),
      addClient(name: string, patch: Partial<Client> = {}) {
        const client: Client = {
          id: uid(),
          name,
          tone: LIST_TONES[0],
          status: 'active',
          contact: '',
          email: '',
          retainer: 0,
          notes: '',
          createdAt: Date.now(),
          ...patch,
        }
        dispatch({ type: 'addClient', client })
        return client
      },
      updateClient: (id: string, patch: Partial<Client>) => dispatch({ type: 'updateClient', id, patch }),
      removeClient: (id: string) => dispatch({ type: 'removeClient', id }),
      addProject(clientId: string, name: string, patch: Partial<Project> = {}) {
        const project: Project = {
          id: uid(),
          clientId,
          name,
          status: 'lead',
          due: null,
          budget: 0,
          rate: 0,
          notes: '',
          order: Date.now(),
          createdAt: Date.now(),
          ...patch,
        }
        dispatch({ type: 'addProject', project })
        return project
      },
      updateProject: (id: string, patch: Partial<Project>) => dispatch({ type: 'updateProject', id, patch }),
      removeProject: (id: string) => dispatch({ type: 'removeProject', id }),
      addMember(name: string, patch: Partial<Member> = {}) {
        const member: Member = {
          id: uid(),
          name,
          role: '',
          tone: MEMBER_TONES[0],
          capacity: 32,
          rate: 0,
          createdAt: Date.now(),
          ...patch,
        }
        dispatch({ type: 'addMember', member })
        return member
      },
      updateMember: (id: string, patch: Partial<Member>) => dispatch({ type: 'updateMember', id, patch }),
      removeMember: (id: string) => dispatch({ type: 'removeMember', id }),
      logTime(entry: Omit<TimeEntry, 'id' | 'createdAt'>) {
        dispatch({ type: 'addTime', entry: { ...entry, id: uid(), createdAt: Date.now() } })
      },
      removeTime: (id: string) => dispatch({ type: 'removeTime', id }),
      setPrefs: (patch: Partial<Prefs>) => dispatch({ type: 'prefs', patch }),
      replace: (state: State) => dispatch({ type: 'replace', state }),
      /** Back to the sample workspace, keeping the chosen background and studio name. */
      reset: () => {
        const seeded = seedState()
        dispatch({ type: 'replace', state: { ...seeded, prefs: { ...seeded.prefs, ...load().prefs } } })
      },
    }),
    [],
  )

  return { state, actions }
}

export type Actions = ReturnType<typeof useStudio>['actions']

/** Defaults a new task picks up from the view it was added in. */
export function defaultsFor(view: View): Partial<Task> {
  if (view.kind === 'list') return { listId: view.id }
  if (view.kind === 'project') return { projectId: view.id }
  if (view.kind === 'client') return { clientId: view.id }
  if (view.kind !== 'smart') return {}
  if (view.id === 'today') return { due: todayKey() }
  if (view.id === 'upcoming') return { due: addDays(todayKey(), 1) }
  if (view.id === 'starred') return { starred: true }
  return {}
}

/** What dropping a task on a sidebar entry does to it. */
export function dropPatch(task: Task, view: View): Partial<Task> | 'complete' | null {
  if (view.kind === 'list') return task.listId === view.id ? null : { listId: view.id }
  if (view.kind !== 'smart') return null
  switch (view.id) {
    case 'inbox':
      return task.listId === null ? null : { listId: null }
    case 'today':
      return { due: todayKey() }
    case 'upcoming':
      return task.due && daysFromToday(task.due) > 0 ? null : { due: addDays(todayKey(), 1) }
    case 'starred':
      return task.starred ? null : { starred: true }
    case 'completed':
      return task.done ? null : 'complete'
  }
}

export function countOpen(tasks: Task[], view: View): number {
  if (view.kind === 'smart' && view.id === 'completed') return 0
  return tasks.reduce((n, t) => (!t.done && inView(t, view) ? n + 1 : n), 0)
}

/** Sort inside a date group: by due date, then the manual order. */
export function byDueThenOrder(a: Task, b: Task): number {
  return (a.due ?? '').localeCompare(b.due ?? '') || a.order - b.order || a.createdAt - b.createdAt
}

export { bucketOf }
