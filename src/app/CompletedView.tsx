import { Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'

import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Popover } from '../components/Popover'
import { SectionLabel } from '../components/SectionLabel'
import { COPY, type EmptyCopy } from '../data'
import { dayHeading, toKey } from '../lib/dates'
import { TaskRow } from './TaskRow'
import { rowMotion } from './TaskView'
import type { Client, Member, Project, Tag, Task, TaskList } from './store'

type Props = {
  tasks: Task[]
  lists: TaskList[]
  tags: Tag[]
  clients: Client[]
  projects: Project[]
  members: Member[]
  empty: EmptyCopy
  onToggle: (task: Task) => void
  onStar: (task: Task) => void
  onDue: (task: Task, due: string | null) => void
  onOpen: (task: Task) => void
  onClearAll: () => void
}

/** Every completed task, newest first, grouped by the day it was finished; with Clear all. */
export function CompletedView({ tasks, lists, tags, clients, projects, members, empty, onToggle, onStar, onDue, onOpen, onClearAll }: Props) {
  const [confirming, setConfirming] = useState(false)
  const clearRef = useRef<HTMLButtonElement>(null)

  const groups = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    const by = new Map<string, Task[]>()
    for (const t of sorted) {
      const k = toKey(new Date(t.completedAt ?? 0))
      by.set(k, [...(by.get(k) ?? []), t])
    }
    return [...by.entries()].map(([k, list]) => ({ key: k, label: dayHeading(list[0].completedAt ?? 0), tasks: list }))
  }, [tasks])

  return (
    <div>
      <div className="flex min-h-[45px] items-center justify-between gap-3 rounded-full frost pr-[6px] pl-[18px]">
        <p className="text-[15px] text-ink-2" aria-live="polite">
          {tasks.length === 0 ? 'No completed tasks' : `${tasks.length} completed ${tasks.length === 1 ? 'task' : 'tasks'}`}
        </p>
        <Button
          ref={clearRef}
          size="sm"
          variant="danger"
          disabled={tasks.length === 0}
          onClick={() => setConfirming((c) => !c)}
          aria-expanded={confirming}
          className="!h-9 !rounded-full bg-white/70"
        >
          <Trash2 size={15} /> Clear all
        </Button>
        <Popover open={confirming} onClose={() => setConfirming(false)} anchorRef={clearRef} width={260} label="Clear completed tasks">
          <div className="p-1.5">
            <p className="text-[14px] font-semibold text-ink">Clear {tasks.length} completed {tasks.length === 1 ? 'task' : 'tasks'}?</p>
            <p className="mt-1 text-[13px] leading-snug text-muted">{COPY.clearCompletedConfirm}</p>
            <div className="mt-3 flex justify-end gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                data-autofocus
                onClick={() => {
                  setConfirming(false)
                  onClearAll()
                }}
              >
                Clear all
              </Button>
            </div>
          </div>
        </Popover>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {tasks.length === 0 && <EmptyState key="empty" title={empty.title} body={empty.body} tone="green" done />}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <motion.section key={g.key} layout="position" aria-label={g.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SectionLabel>{g.label}</SectionLabel>
            <ul>
              <AnimatePresence initial={false}>
                {g.tasks.map((t) => (
                  <motion.li key={t.id} layout="position" {...rowMotion} className="mb-[7px] list-none">
                    <TaskRow
                      task={t}
                      completing={false}
                      list={lists.find((l) => l.id === t.listId)}
                      project={projects.find((p) => p.id === t.projectId)}
                      client={clients.find((c) => c.id === t.clientId)}
                      member={members.find((m) => m.id === t.assigneeId)}
                      tags={tags}
                      onToggle={() => onToggle(t)}
                      onStar={() => onStar(t)}
                      onDue={(d) => onDue(t, d)}
                      onOpen={() => onOpen(t)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  )
}
