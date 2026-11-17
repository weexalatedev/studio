import { CalendarDays, Repeat2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { Avatar } from './agencyUi'

import { Checkbox } from '../components/Checkbox'
import { DatePicker } from '../components/DatePicker'
import { DueBadge } from '../components/DueBadge'
import { IconButton } from '../components/IconButton'
import { Popover } from '../components/Popover'
import { PriorityFlag } from '../components/PriorityFlag'
import { ProgressRing } from '../components/ProgressRing'
import { StarButton } from '../components/StarButton'
import { TagChip } from '../components/TagChip'
import { toneSolid } from '../components/tones'
import type { Tone } from '../data'
import { repeatLabel } from './RepeatPicker'
import { useDrag } from './dnd'
import type { Client, Member, Project, Tag, Task, TaskList } from './store'

type Props = {
  task: Task
  /** True while the completion animation plays, before the task moves. */
  completing: boolean
  list?: TaskList
  project?: Project
  client?: Client
  member?: Member
  tags: Tag[]
  onToggle: () => void
  onStar: () => void
  onDue: (due: string | null) => void
  onOpen: () => void
  /** Alt+↑ / Alt+↓ reorder from the keyboard. */
  onMove?: (dir: -1 | 1) => void
}

const MAX_TAGS = 2

/**
 * A white pill row: checkbox, title, meta (subtask ring, tags, list, repeat,
 * flag, date), star and a hover date button. The title is the row's button
 * and stretches over the whole pill, so the row is one click target without
 * nesting interactive elements.
 */
export function TaskRow({ task, completing, list, project, client, member, tags, onToggle, onStar, onDue, onOpen, onMove }: Props) {
  const done = task.done || completing
  const [picking, setPicking] = useState(false)
  const calRef = useRef<HTMLButtonElement>(null)
  const { drag, onPointerDown } = useDrag()
  const dragging = drag?.task.id === task.id
  const dropPlace = drag?.target?.kind === 'row' && drag.target.id === task.id ? drag.target.place : null

  const taskTags = task.tags.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => !!t)
  const subDone = task.subtasks.filter((s) => s.done).length
  const metaTone: Tone = project ? (client?.tone ?? 'slate') : (list?.tone ?? 'slate')

  return (
    <div
      data-drop-row={task.done ? undefined : task.id}
      onPointerDown={(e) => onPointerDown(e, task)}
      className={`group relative flex min-h-[45px] items-center gap-[12px] rounded-full bg-white py-[6px] pr-[12px] pl-[15px] shadow-[var(--shadow-row)] transition-[transform,box-shadow,opacity] duration-200 [-webkit-touch-callout:none] hover:-translate-y-px hover:shadow-[0_2px_4px_rgb(16_24_40/0.06),0_10px_24px_-10px_rgb(16_24_40/0.3)] active:translate-y-0 active:scale-[0.995] ${
        task.done ? 'bg-white/85' : ''
      } ${dragging ? 'opacity-40' : ''}`}
    >
      {dropPlace && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-5 h-[3px] rounded-full bg-inbox shadow-[0_0_0_2px_rgb(255_255_255/0.9)] ${
            dropPlace === 'before' ? '-top-[5px]' : '-bottom-[5px]'
          }`}
        />
      )}

      <span data-no-drag className="relative z-10 grid">
        <Checkbox checked={done} onChange={onToggle} label={done ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`} />
      </span>

      <button
        type="button"
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault()
            onToggle()
          } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && onMove && !task.done) {
            e.preventDefault()
            onMove(e.key === 'ArrowUp' ? -1 : 1)
          }
        }}
        data-focus-key={`task-${task.id}`}
        aria-keyshortcuts="Space Alt+ArrowUp Alt+ArrowDown"
        aria-description="Enter opens details, Space completes, Alt plus arrow keys reorder"
        className="flex min-w-0 flex-1 items-center text-left outline-none before:absolute before:inset-0 before:rounded-full before:transition-shadow focus-visible:before:shadow-[0_0_0_2px_var(--color-inbox)]"
      >
        <span
          data-done={done}
          className={`strike min-w-0 truncate pl-[3px] text-[16px] leading-[1.35] ${done ? 'text-muted' : 'text-ink'}`}
        >
          {task.title}
        </span>
        {task.done && <span className="sr-only"> (completed)</span>}
      </button>

      {/* Meta: never interactive, so pointer events fall through to the title button. */}
      <span className="pointer-events-none relative flex shrink-0 items-center gap-2.5 empty:hidden">
        {task.subtasks.length > 0 && <ProgressRing done={subDone} total={task.subtasks.length} />}
        {taskTags.length > 0 && (
          <span className="hidden items-center gap-1 sm:inline-flex">
            {taskTags.slice(0, MAX_TAGS).map((t) => (
              <TagChip key={t.id} name={t.name} tone={t.tone} />
            ))}
            {taskTags.length > MAX_TAGS && (
              <span className="text-[12px] font-semibold text-muted">+{taskTags.length - MAX_TAGS}</span>
            )}
          </span>
        )}
        {(project || list) && (
          <span className="hidden items-center gap-1.5 text-[12.5px] font-semibold text-muted sm:inline-flex">
            <span className="size-2 rounded-full" style={{ background: toneSolid(metaTone) }} />
            {project?.name ?? list?.name}
          </span>
        )}
        {task.repeat && (
          <span role="img" aria-label={repeatLabel(task.repeat)} title={repeatLabel(task.repeat)} className="text-muted">
            <Repeat2 size={15} strokeWidth={2.2} aria-hidden />
          </span>
        )}
        <PriorityFlag priority={task.priority} />
        {task.estimate > 0 && <span className="text-[12px] font-semibold tabular-nums text-muted">{task.estimate}h</span>}
        {task.due && <DueBadge due={task.due} done={done} />}
        {member && <Avatar member={member} size={20} />}
      </span>

      <span data-no-drag className="relative z-10 flex items-center gap-[12px]">
        <StarButton starred={task.starred} onToggle={onStar} size={20} quiet label={task.title} />
        <IconButton
          ref={calRef}
          label={`Set due date for “${task.title}”`}
          active={picking}
          onClick={() => setPicking((p) => !p)}
          className={`!rounded-full ${picking ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'} max-sm:hidden`}
        >
          <CalendarDays size={18} strokeWidth={1.8} />
        </IconButton>
      </span>
      <Popover open={picking} onClose={() => setPicking(false)} anchorRef={calRef} label="Due date">
        <DatePicker
          value={task.due}
          onChange={(v) => {
            onDue(v)
            setPicking(false)
          }}
        />
      </Popover>
    </div>
  )
}
