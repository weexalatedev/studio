import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { SectionLabel } from '../components/SectionLabel'
import { GROUP_LABELS, type Tone } from '../data'
import { bucketOf, type DateBucket } from '../lib/dates'
import { TaskRow } from './TaskRow'
import { byDueThenOrder, type Client, type Member, type Project, type Tag, type Task, type TaskList } from './store'

const ORDER: DateBucket[] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'none']

export type Empty = { title: string; body: string; tone: Tone; done: boolean }

type Props = {
  open: Task[]
  done: Task[]
  completing: Set<string>
  lists: TaskList[]
  tags: Tag[]
  clients: Client[]
  projects: Project[]
  members: Member[]
  /** Show the list name on rows (smart lists and search, not inside a list). */
  showList: boolean
  empty: Empty
  onToggle: (task: Task) => void
  onStar: (task: Task) => void
  onDue: (task: Task, due: string | null) => void
  onOpen: (task: Task) => void
  onMove: (task: Task, dir: -1 | 1, siblings: Task[]) => void
}

export const rowMotion = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, height: 0, marginBottom: 0, scale: 0.97, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const } },
}

/** Group open tasks by due-date bucket, sorted by due date then manual order. */
export function groupOpen(open: Task[]) {
  const by = new Map<DateBucket, Task[]>()
  for (const t of open) {
    const b = bucketOf(t.due)
    by.set(b, [...(by.get(b) ?? []), t])
  }
  return ORDER.filter((b) => by.has(b)).map((b) => ({ bucket: b, tasks: by.get(b)!.sort(byDueThenOrder) }))
}

/** Open tasks grouped by due date, then a collapsible Completed group. */
export function TaskView({ open, done, completing, lists, tags, clients, projects, members, showList, empty, onToggle, onStar, onDue, onOpen, onMove }: Props) {
  const [showDone, setShowDone] = useState(false)
  const mountedAt = useRef(Date.now())

  const groups = useMemo(() => groupOpen(open), [open])
  const doneSorted = useMemo(() => [...done].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)), [done])

  let index = 0
  const delay = () => {
    const i = index++
    return Date.now() - mountedAt.current < 800 ? 0.12 + i * 0.05 : 0
  }

  const row = (t: Task, siblings: Task[]) => (
    <motion.li
      key={t.id}
      layout="position"
      {...rowMotion}
      transition={{ type: 'spring', stiffness: 420, damping: 34, delay: delay() }}
      className="mb-[7px] list-none"
    >
      <TaskRow
        task={t}
        completing={completing.has(t.id)}
        list={showList ? lists.find((l) => l.id === t.listId) : undefined}
        project={projects.find((p) => p.id === t.projectId)}
        client={clients.find((c) => c.id === t.clientId)}
        member={members.find((m) => m.id === t.assigneeId)}
        tags={tags}
        onToggle={() => onToggle(t)}
        onStar={() => onStar(t)}
        onDue={(d) => onDue(t, d)}
        onOpen={() => onOpen(t)}
        onMove={(dir) => onMove(t, dir, siblings)}
      />
    </motion.li>
  )

  return (
    <div>
      <AnimatePresence initial={false} mode="popLayout">
        {open.length === 0 && <EmptyState key={`empty-${empty.done}`} title={empty.title} body={empty.body} tone={empty.tone} done={empty.done} />}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <motion.section
            key={g.bucket}
            layout="position"
            aria-label={GROUP_LABELS[g.bucket]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <SectionLabel>
              <span className={g.bucket === 'overdue' ? 'text-[#ffd6d6]' : undefined}>{GROUP_LABELS[g.bucket]}</span>
            </SectionLabel>
            <ul>
              <AnimatePresence initial>{g.tasks.map((t) => row(t, g.tasks))}</AnimatePresence>
            </ul>
          </motion.section>
        ))}
      </AnimatePresence>

      {doneSorted.length > 0 && (
        <motion.section layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-label="Completed">
          <SectionLabel>
            <button
              type="button"
              onClick={() => setShowDone((s) => !s)}
              aria-expanded={showDone}
              className="hit-40 -mx-1 inline-flex min-h-8 items-center gap-1 rounded-full px-1 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white"
            >
              Completed <span className="tabular-nums opacity-80">{doneSorted.length}</span>
              <ChevronDown size={14} strokeWidth={2.4} className={`transition-transform duration-200 ${showDone ? '' : '-rotate-90'}`} />
            </button>
          </SectionLabel>
          <ul>
            <AnimatePresence initial={false}>{showDone && doneSorted.map((t) => row(t, doneSorted))}</AnimatePresence>
          </ul>
        </motion.section>
      )}
    </div>
  )
}
