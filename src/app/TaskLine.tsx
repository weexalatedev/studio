import { Check } from 'lucide-react'

import { DueBadge } from '../components/DueBadge'
import { PriorityFlag } from '../components/PriorityFlag'
import { Avatar } from './agencyUi'
import type { Client, Member, Project, Task } from './store'

type Props = {
  task: Task
  project?: Project
  client?: Client
  member?: Member | null
  /** Show the project name after the title. */
  showProject?: boolean
  onOpen: () => void
  onToggle?: () => void
}

/** A compact task row for the studio panels (overview, client and project pages). */
export function TaskLine({ task, project, client, member, showProject = true, onOpen, onToggle }: Props) {
  return (
    <div className="group flex min-h-[46px] items-center gap-2.5 px-4 py-1.5 transition-colors hover:bg-hover/70">
      <button
        type="button"
        aria-label={task.done ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}
        aria-pressed={task.done}
        onClick={onToggle}
        disabled={!onToggle}
        className={`hit-40 grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox ${
          task.done ? 'border-success bg-success text-white' : 'border-line-strong bg-white hover:border-success'
        }`}
      >
        {task.done && <Check size={11} strokeWidth={3} aria-hidden />}
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:underline"
      >
        <span className={`min-w-0 truncate text-[14px] ${task.done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</span>
        {showProject && project && (
          <span className="hidden shrink-0 items-center gap-1 text-[12px] font-medium text-muted sm:inline-flex">
            <span className="size-1.5 rounded-full" style={{ background: `var(--color-${client?.tone ?? 'slate'})` }} />
            {project.name}
          </span>
        )}
      </button>
      <span className="flex shrink-0 items-center gap-2">
        <PriorityFlag priority={task.priority} />
        {task.due && <DueBadge due={task.due} done={task.done} />}
        <Avatar member={member} size={22} />
      </span>
    </div>
  )
}
