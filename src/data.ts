// All copy and seed data in one place. Start here to rename the studio, change
// the starter workspace or swap the background for a real photo.

import type { DateBucket } from './lib/dates'

export const APP_NAME = 'Studio'
/**
 * Background photo. Leave `null` to use the built-in illustrated landscape
 * (`src/components/Landscape.tsx`), or drop a wide photo into
 * `public/images/` and point this at it, e.g. '/images/valley.jpg'.
 */
export const BACKGROUND_PHOTO: string | null = null

export const STORAGE_KEY = 'studio:v3'
/** Older keys, read once and migrated into STORAGE_KEY. */
export const LEGACY_STORAGE_KEYS = ['tasky:v2', 'tasky:v1']

export type SmartListId = 'inbox' | 'today' | 'upcoming' | 'starred' | 'completed'

export type Tone = 'inbox' | 'today' | 'upcoming' | 'starred' | 'teal' | 'rose' | 'green' | 'slate'

/** Copy for a calm empty state: `title` + `body`, and a variant for "you finished everything". */
export type EmptyCopy = { title: string; body: string; doneTitle: string; doneBody: string }

export const SMART_LISTS: { id: SmartListId; name: string; tone: Tone; empty: EmptyCopy }[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    tone: 'inbox',
    empty: {
      title: 'Inbox zero',
      body: 'Nothing waiting here. Add a task above when something comes up.',
      doneTitle: 'All done',
      doneBody: 'Every task in your inbox is finished. Enjoy the view.',
    },
  },
  {
    id: 'today',
    name: 'Today',
    tone: 'today',
    empty: {
      title: 'A clear day',
      body: 'Nothing is due today. Add a task here to plan it for today.',
      doneTitle: 'Done for today',
      doneBody: 'You finished everything due today. Time to rest.',
    },
  },
  {
    id: 'upcoming',
    name: 'Upcoming',
    tone: 'upcoming',
    empty: {
      title: 'Nothing ahead',
      body: 'Tasks with a future due date gather here.',
      doneTitle: 'All caught up',
      doneBody: 'Everything coming up is already done.',
    },
  },
  {
    id: 'starred',
    name: 'Starred',
    tone: 'starred',
    empty: {
      title: 'No stars yet',
      body: 'Star a task to keep it close at hand.',
      doneTitle: 'Stars all done',
      doneBody: 'Every starred task is finished.',
    },
  },
  {
    id: 'completed',
    name: 'Completed',
    tone: 'green',
    empty: {
      title: 'Nothing completed yet',
      body: 'Tick a task and it lands here, grouped by the day you finished it.',
      doneTitle: 'Nothing completed yet',
      doneBody: 'Tick a task and it lands here.',
    },
  },
]

export const LIST_EMPTY: EmptyCopy = {
  title: 'A fresh list',
  body: 'Add the first task above, or drag one here from another list.',
  doneTitle: 'List complete',
  doneBody: 'Every task in this list is done. Nicely handled.',
}

/** Colours a new user list cycles through (also the tag colours). */
export const LIST_TONES: Tone[] = ['teal', 'rose', 'green', 'slate', 'upcoming', 'today', 'inbox']

/** Icons a user list can wear; keys map to lucide icons in src/app/listIcons.ts. */
export const LIST_ICON_IDS = [
  'list',
  'briefcase',
  'home',
  'cart',
  'plane',
  'heart',
  'book',
  'dumbbell',
  'code',
  'music',
  'gift',
  'leaf',
] as const
export type ListIconId = (typeof LIST_ICON_IDS)[number]

export type SceneId = 'day' | 'dusk' | 'night' | 'snow'

/** Background scenes, first is the default. `base` tints the page behind the SVG. */
export const SCENES: { id: SceneId; name: string; base: string }[] = [
  { id: 'dusk', name: 'Dusk', base: '#9ec3d4' },
  { id: 'day', name: 'Day', base: '#8fc3e3' },
  { id: 'night', name: 'Night', base: '#1b2740' },
  { id: 'snow', name: 'Snow', base: '#b9cad6' },
]

export type Priority = 0 | 1 | 2 | 3

export const PRIORITIES: { id: Priority; label: string; short: string }[] = [
  { id: 0, label: 'None', short: 'None' },
  { id: 1, label: 'Low priority', short: 'Low' },
  { id: 2, label: 'Medium priority', short: 'Med' },
  { id: 3, label: 'High priority', short: 'High' },
]

export const DATE_FILTERS: { id: Exclude<DateBucket, 'overdue'>; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'Next 7 Days' },
  { id: 'later', label: 'Later' },
  { id: 'none', label: 'No Date' },
]

export const GROUP_LABELS: Record<DateBucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'Next 7 Days',
  later: 'Later',
  none: 'No Date',
}

/* ------------------------------------------------------------------ clients */

export type ClientStatus = 'lead' | 'active' | 'paused' | 'archived'

export const CLIENT_STATUSES: { id: ClientStatus; label: string; tone: Tone }[] = [
  { id: 'active', label: 'Active', tone: 'green' },
  { id: 'lead', label: 'Lead', tone: 'upcoming' },
  { id: 'paused', label: 'Paused', tone: 'today' },
  { id: 'archived', label: 'Archived', tone: 'slate' },
]

/* ----------------------------------------------------------------- projects */

export type ProjectStatus = 'lead' | 'discovery' | 'design' | 'build' | 'review' | 'launched' | 'archived'

export const PROJECT_STATUSES: { id: ProjectStatus; label: string; tone: Tone; hint: string }[] = [
  { id: 'lead', label: 'Lead', tone: 'slate', hint: 'Pitching, not won yet' },
  { id: 'discovery', label: 'Discovery', tone: 'upcoming', hint: 'Research and scoping' },
  { id: 'design', label: 'Design', tone: 'rose', hint: 'Concepts and UI' },
  { id: 'build', label: 'Build', tone: 'inbox', hint: 'Engineering in progress' },
  { id: 'review', label: 'Review', tone: 'today', hint: 'Client feedback and QA' },
  { id: 'launched', label: 'Launched', tone: 'green', hint: 'Live and handed over' },
  { id: 'archived', label: 'Archived', tone: 'slate', hint: 'Parked' },
]

/** Column order on the pipeline bar. */
export const PIPELINE: ProjectStatus[] = ['lead', 'discovery', 'design', 'build', 'review', 'launched']

/* ------------------------------------------------------------------- tasks */

export type TaskStatus = 'todo' | 'doing' | 'review'

export const TASK_STATUSES: { id: TaskStatus; label: string; tone: Tone }[] = [
  { id: 'todo', label: 'To do', tone: 'slate' },
  { id: 'doing', label: 'In progress', tone: 'inbox' },
  { id: 'review', label: 'In review', tone: 'today' },
]

export const MEMBER_TONES: Tone[] = ['teal', 'rose', 'green', 'slate', 'upcoming', 'today', 'inbox']

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const COPY = {
  searchPlaceholder: 'Search tasks, clients...',
  addPlaceholder: 'Add a task...',
  smartListsHeading: 'Smart Lists',
  listsHeading: 'Lists',
  listsEmpty: 'No lists yet. Use + to add one.',
  newListPlaceholder: 'List name',
  searchTitle: 'Search',
  noResults: 'No tasks match',
  completed: 'Completed',
  notesPlaceholder: 'Add notes...',
  deleteListConfirm: 'Tasks in this list move to the Inbox.',
  subtaskPlaceholder: 'Add a subtask...',
  palettePlaceholderText: 'Type a command or search...',
  clearCompletedConfirm: 'Completed tasks are deleted. You can undo right after.',
  importHelp: 'Import replaces everything with the contents of a Studio JSON export.',
  quickAddHint: 'Tip: type #tag or !high while adding a task.',
}

export type SeedClient = {
  id: string
  name: string
  tone: Tone
  status: ClientStatus
  contact: string
  email: string
  retainer: number
  notes: string
}

export const SEED_CLIENTS: SeedClient[] = [
  {
    id: 'cl-halcyon',
    name: 'Halcyon Coffee',
    tone: 'rose',
    status: 'active',
    contact: 'Mara Ellis',
    email: 'mara@halcyoncoffee.com',
    retainer: 4500,
    notes: 'Specialty roaster, three cafés. Brand-first, loves print textures.',
  },
  {
    id: 'cl-meridian',
    name: 'Meridian Health',
    tone: 'teal',
    status: 'active',
    contact: 'Dr. Priya Rao',
    email: 'p.rao@meridianhealth.io',
    retainer: 8000,
    notes: 'Patient portal work. Accessibility review required before every release.',
  },
  {
    id: 'cl-ridge',
    name: 'Ridge & Pine',
    tone: 'green',
    status: 'lead',
    contact: 'Tom Aker',
    email: 'tom@ridgeandpine.co',
    retainer: 0,
    notes: 'Outdoor outfitter. Proposal sent, waiting on their board.',
  },
  {
    id: 'cl-kestrel',
    name: 'Kestrel Fintech',
    tone: 'slate',
    status: 'paused',
    contact: 'Aline Dupont',
    email: 'aline@kestrel.finance',
    retainer: 3000,
    notes: 'Paused until their funding round closes in Q1.',
  },
]

export type SeedProject = {
  id: string
  clientId: string
  name: string
  status: ProjectStatus
  dueInDays: number | null
  budget: number
  rate: number
  notes: string
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'pr-halcyon-brand',
    clientId: 'cl-halcyon',
    name: 'Halcyon rebrand',
    status: 'design',
    dueInDays: 12,
    budget: 18000,
    rate: 120,
    notes: 'Identity, packaging and a launch toolkit for the spring range.',
  },
  {
    id: 'pr-halcyon-shop',
    clientId: 'cl-halcyon',
    name: 'Halcyon shop rebuild',
    status: 'build',
    dueInDays: 26,
    budget: 12000,
    rate: 120,
    notes: 'Shopify storefront, subscription flow and wholesale portal.',
  },
  {
    id: 'pr-meridian-portal',
    clientId: 'cl-meridian',
    name: 'Patient portal',
    status: 'build',
    dueInDays: 8,
    budget: 64000,
    rate: 145,
    notes: 'Appointments, records and secure messaging. WCAG 2.2 AA.',
  },
  {
    id: 'pr-meridian-audit',
    clientId: 'cl-meridian',
    name: 'Design system audit',
    status: 'review',
    dueInDays: 3,
    budget: 9000,
    rate: 145,
    notes: 'Component inventory, token cleanup and a migration plan.',
  },
  {
    id: 'pr-ridge-site',
    clientId: 'cl-ridge',
    name: 'Ridge & Pine website',
    status: 'lead',
    dueInDays: 30,
    budget: 22000,
    rate: 110,
    notes: 'Headless commerce with an editorial trail guide.',
  },
  {
    id: 'pr-kestrel-onboarding',
    clientId: 'cl-kestrel',
    name: 'Kestrel onboarding',
    status: 'discovery',
    dueInDays: -4,
    budget: 15000,
    rate: 135,
    notes: 'Onboarding funnel research and a new activation flow.',
  },
]

export type SeedMember = {
  id: string
  name: string
  role: string
  tone: Tone
  capacity: number
  rate: number
}

export const SEED_MEMBERS: SeedMember[] = [
  { id: 'me-ana', name: 'Ana Torres', role: 'Creative Director', tone: 'rose', capacity: 32, rate: 140 },
  { id: 'me-sam', name: 'Sam Wu', role: 'Design Lead', tone: 'teal', capacity: 36, rate: 120 },
  { id: 'me-dev', name: 'Dev Patel', role: 'Engineer', tone: 'slate', capacity: 40, rate: 135 },
  { id: 'me-iris', name: 'Iris Berg', role: 'Producer', tone: 'green', capacity: 30, rate: 95 },
]

export type SeedTask = {
  title: string
  notes: string
  starred: boolean
  clientId: string | null
  projectId: string | null
  assigneeId: string | null
  dueInDays: number | null
  priority: Priority
  status: TaskStatus
  estimate: number
  billable: boolean
  tags: string[]
  listKey?: string
  /** Completed this many days ago (omit for an open task). */
  doneDaysAgo?: number
}

/** Starter workspace: a realistic studio week, so every screen has something in it. */
export const SEED_TASKS: SeedTask[] = [
  {
    title: 'Present the Halcyon identity routes to Mara',
    notes: 'Walk through three directions, land on one, agree the packaging schedule.',
    starred: true,
    clientId: 'cl-halcyon',
    projectId: 'pr-halcyon-brand',
    assigneeId: 'me-ana',
    dueInDays: 0,
    priority: 3,
    status: 'doing',
    estimate: 3,
    billable: true,
    tags: ['brand', 'client-review'],
    listKey: 'creative',
  },
  {
    title: 'Refine Halcyon logotype spacing',
    notes: 'Optical kerning at small sizes, then export the lockup set.',
    starred: false,
    clientId: 'cl-halcyon',
    projectId: 'pr-halcyon-brand',
    assigneeId: 'me-sam',
    dueInDays: 2,
    priority: 2,
    status: 'doing',
    estimate: 6,
    billable: true,
    tags: ['brand'],
    listKey: 'creative',
  },
  {
    title: 'Ship the appointment booking API',
    notes: 'Slots, holds and cancellation webhooks. Needs a contract test run.',
    starred: false,
    clientId: 'cl-meridian',
    projectId: 'pr-meridian-portal',
    assigneeId: 'me-dev',
    dueInDays: 1,
    priority: 3,
    status: 'doing',
    estimate: 12,
    billable: true,
    tags: ['web'],
    listKey: 'engineering',
  },
  {
    title: 'Accessibility pass on the portal forms',
    notes: 'Focus order, error announcements, 200% zoom. Log issues in the audit doc.',
    starred: false,
    clientId: 'cl-meridian',
    projectId: 'pr-meridian-portal',
    assigneeId: 'me-sam',
    dueInDays: 4,
    priority: 2,
    status: 'todo',
    estimate: 5,
    billable: true,
    tags: ['web', 'client-review'],
    listKey: 'engineering',
  },
  {
    title: 'Send the design system audit deck',
    notes: 'Twelve page summary, top ten fixes, and the migration estimate.',
    starred: true,
    clientId: 'cl-meridian',
    projectId: 'pr-meridian-audit',
    assigneeId: 'me-iris',
    dueInDays: 3,
    priority: 3,
    status: 'review',
    estimate: 4,
    billable: true,
    tags: ['client-review'],
    listKey: 'creative',
  },
  {
    title: 'Ridge & Pine proposal follow-up',
    notes: 'Nudge Tom, attach the trail guide concept and the phased budget.',
    starred: false,
    clientId: 'cl-ridge',
    projectId: 'pr-ridge-site',
    assigneeId: 'me-ana',
    dueInDays: -1,
    priority: 2,
    status: 'todo',
    estimate: 1,
    billable: false,
    tags: [],
    listKey: 'ops',
  },
  {
    title: 'Kestrel discovery interviews',
    notes: 'Three sessions with their ops team; synthesise the activation gaps.',
    starred: false,
    clientId: 'cl-kestrel',
    projectId: 'pr-kestrel-onboarding',
    assigneeId: 'me-iris',
    dueInDays: -3,
    priority: 1,
    status: 'review',
    estimate: 8,
    billable: true,
    tags: [],
    listKey: 'ops',
  },
  {
    title: 'Invoice run and retainer reconciliation',
    notes: 'Check logged hours against retainers, then send the month-end invoices.',
    starred: false,
    clientId: null,
    projectId: null,
    assigneeId: 'me-iris',
    dueInDays: 6,
    priority: 2,
    status: 'todo',
    estimate: 2,
    billable: false,
    tags: [],
    listKey: 'ops',
  },
  {
    title: 'Halcyon packaging dielines',
    notes: 'Three bag sizes and the shelf-ready carton, ready for the print quote.',
    starred: false,
    clientId: 'cl-halcyon',
    projectId: 'pr-halcyon-shop',
    assigneeId: 'me-sam',
    dueInDays: 5,
    priority: 2,
    status: 'doing',
    estimate: 9,
    billable: true,
    tags: ['brand'],
    listKey: 'creative',
  },
  {
    title: 'Brand workshop with Mara',
    notes: 'Positioning, tone and the three routes. Notes are in the Halcyon drive.',
    starred: false,
    clientId: 'cl-halcyon',
    projectId: 'pr-halcyon-brand',
    assigneeId: 'me-ana',
    dueInDays: 2,
    priority: 2,
    status: 'review',
    estimate: 3,
    billable: true,
    tags: ['brand', 'client-review'],
    listKey: 'creative',
    doneDaysAgo: 2,
  },
  {
    title: 'Set up the Meridian project space',
    notes: 'Repos, staging environment and the shared review folder.',
    starred: false,
    clientId: 'cl-meridian',
    projectId: 'pr-meridian-portal',
    assigneeId: 'me-iris',
    dueInDays: 1,
    priority: 1,
    status: 'review',
    estimate: 2,
    billable: false,
    tags: [],
    listKey: 'ops',
    doneDaysAgo: 1,
  },
]

export const SEED_LISTS: { key: string; name: string; tone: Tone; icon: ListIconId }[] = [
  { key: 'creative', name: 'Creative', tone: 'rose', icon: 'briefcase' },
  { key: 'engineering', name: 'Engineering', tone: 'inbox', icon: 'code' },
  { key: 'ops', name: 'Studio Ops', tone: 'green', icon: 'list' },
]

export const SEED_TAGS: { key: string; name: string; tone: Tone }[] = [
  { key: 'brand', name: 'brand', tone: 'rose' },
  { key: 'web', name: 'web', tone: 'inbox' },
  { key: 'client-review', name: 'client-review', tone: 'today' },
]

/** Time entries logged in the last few days, so the dashboard and time sheet are alive. */
export const SEED_TIME: { taskIndex: number; memberId: string; daysAgo: number; minutes: number; note: string }[] = [
  { taskIndex: 0, memberId: 'me-ana', daysAgo: 1, minutes: 90, note: 'Route exploration and client prep' },
  { taskIndex: 0, memberId: 'me-iris', daysAgo: 1, minutes: 60, note: 'Deck and scheduling' },
  { taskIndex: 1, memberId: 'me-sam', daysAgo: 2, minutes: 180, note: 'Kerning pass' },
  { taskIndex: 2, memberId: 'me-dev', daysAgo: 1, minutes: 300, note: 'Slot holds and webhooks' },
  { taskIndex: 2, memberId: 'me-dev', daysAgo: 3, minutes: 120, note: 'Contract tests' },
  { taskIndex: 4, memberId: 'me-iris', daysAgo: 2, minutes: 150, note: 'Audit deck build' },
  { taskIndex: 3, memberId: 'me-sam', daysAgo: 4, minutes: 60, note: 'Form audit, first pass' },
  { taskIndex: 6, memberId: 'me-iris', daysAgo: 5, minutes: 240, note: 'Interview synthesis' },
]
