import { CalendarDays, ChevronDown, Clock3, Inbox, Plus, Repeat2, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'

import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { DatePicker } from '../components/DatePicker'
import { Drawer } from '../components/Drawer'
import { DueBadge } from '../components/DueBadge'
import { IconButton } from '../components/IconButton'
import { MenuItem, MenuLabel } from '../components/Menu'
import { Popover } from '../components/Popover'
import { PRIORITY_COLOR } from '../components/PriorityFlag'
import { SegmentedControl } from '../components/SegmentedControl'
import { Select } from '../components/Select'
import { StarButton } from '../components/StarButton'
import { TagChip } from '../components/TagChip'
import { TextArea, TextInput } from '../components/TextField'
import { toneSolid } from '../components/tones'
import { COPY, PRIORITIES, TASK_STATUSES, type Priority, type TaskStatus } from '../data'
import { longLabel, shortLabel, todayKey } from '../lib/dates'
import { dateLabel, hoursLabel } from '../lib/format'
import { RepeatPicker, repeatLabel } from './RepeatPicker'
import { Subtasks } from './Subtasks'
import { TagPicker } from './TagPicker'
import { LIST_ICONS } from './listIcons'
import { nextDue, type Member, type Project, type Tag, type Task, type TaskList, type TimeEntry } from './store'

type Props = {
  task: Task | null
  lists: TaskList[]
  tags: Tag[]
  projects: Project[]
  members: Member[]
  time: TimeEntry[]
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onCreateTag: (name: string) => Tag
  onLogTime: (minutes: number, note: string) => void
  onRemoveTime: (id: string) => void
}

const created = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Task details: title, star, due, repeat, priority, list, tags, subtasks, notes, complete and delete. */
export function TaskDrawer({ task, ...rest }: Props) {
  // Keep the last task around so the sheet can animate out with content.
  const last = useRef<Task | null>(null)
  if (task) last.current = task
  const t = task ?? last.current

  return (
    <Drawer open={!!task} onClose={rest.onClose} label="Task details">
      {t && <DrawerBody key={t.id} task={t} {...rest} />}
    </Drawer>
  )
}

type Picking = 'date' | 'list' | 'repeat' | 'tags' | null

function DrawerBody({ task, lists, tags, projects, members, time, onClose, onUpdate, onToggle, onRemove, onCreateTag, onLogTime, onRemoveTime }: Props & { task: Task }) {
  const [title, setTitle] = useState(task.title)
  const [picking, setPicking] = useState<Picking>(null)
  const [confirming, setConfirming] = useState(false)
  const refs = {
    date: useRef<HTMLButtonElement>(null),
    list: useRef<HTMLButtonElement>(null),
    repeat: useRef<HTMLButtonElement>(null),
    tags: useRef<HTMLButtonElement>(null),
  }
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const list = lists.find((l) => l.id === task.listId)
  const ListIcon = list ? LIST_ICONS[list.icon].icon : Inbox
  const update = (patch: Partial<Task>) => onUpdate(task.id, patch)
  const toggle = (p: Exclude<Picking, null>) => setPicking(picking === p ? null : p)
  const taskTags = task.tags.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => !!t)
  const [logHours, setLogHours] = useState('1')
  const [logNote, setLogNote] = useState('')
  const entries = time.filter((e) => e.taskId === task.id)
  const logged = entries.reduce((n, e) => n + e.minutes, 0)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [title])

  const commitTitle = () => {
    const next = title.trim()
    if (next && next !== task.title) update({ title: next })
    else setTitle(task.title)
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-[13px] font-semibold text-muted">{task.done ? 'Completed' : 'Task'}</span>
        <IconButton label="Close" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex items-start gap-3 pt-1">
          <div className="pt-[7px]">
            <Checkbox checked={task.done} onChange={() => onToggle(task.id)} label={task.done ? 'Mark as not done' : 'Mark as done'} size={24} />
          </div>
          <textarea
            ref={titleRef}
            value={title}
            rows={1}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ''))}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            aria-label="Title"
            maxLength={200}
            className={`min-w-0 flex-1 resize-none rounded-[8px] bg-transparent text-[22px] leading-[1.3] font-semibold outline-none focus-visible:shadow-[0_0_0_2px_rgb(31_124_246/0.35)] ${task.done ? 'text-muted line-through' : 'text-ink'}`}
          />
          <StarButton starred={task.starred} onToggle={() => update({ starred: !task.starred })} size={22} className="mt-0.5" />
        </div>

        <dl className="mt-5 divide-y divide-line rounded-[16px] border border-line">
          <Field label="Due">
            <FieldButton ref={refs.date} onClick={() => toggle('date')} expanded={picking === 'date'}>
              {task.due ? (
                <>
                  <DueBadge due={task.due} done={task.done} />
                  <span className="font-medium text-muted max-[380px]:hidden">{longLabel(task.due)}</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-muted">
                  <CalendarDays size={15} /> Add date
                </span>
              )}
            </FieldButton>
            <Popover open={picking === 'date'} onClose={() => setPicking(null)} anchorRef={refs.date} label="Due date">
              <DatePicker
                value={task.due}
                onChange={(v) => {
                  update({ due: v, ...(v ? {} : { repeat: null }) })
                  setPicking(null)
                }}
              />
            </Popover>
          </Field>

          <Field label="Repeat">
            <FieldButton ref={refs.repeat} onClick={() => toggle('repeat')} expanded={picking === 'repeat'}>
              <Repeat2 size={15} className={task.repeat ? 'text-upcoming' : 'text-muted'} aria-hidden />
              <span className={task.repeat ? 'text-ink' : 'text-muted'}>{task.repeat ? repeatLabel(task.repeat) : 'Never'}</span>
              <ChevronDown size={15} className="text-muted" aria-hidden />
            </FieldButton>
            <Popover open={picking === 'repeat'} onClose={() => setPicking(null)} anchorRef={refs.repeat} label="Repeat" width={260}>
              <RepeatPicker
                value={task.repeat}
                onChange={(r) => {
                  // A repeating task needs an anchor date: default to today.
                  update({ repeat: r, ...(r && !task.due ? { due: todayKey() } : {}) })
                  setPicking(null)
                }}
              />
            </Popover>
          </Field>
          {task.repeat && !task.done && (
            <div className="flex items-center gap-1 px-4 py-2 text-[12.5px] text-muted">
              <dt>Next after this one:</dt>
              <dd className="font-semibold">{shortLabel(nextDue(task))}</dd>
            </div>
          )}

          <Field label="Priority">
            <SegmentedControl
              variant="solid"
              clearable={false}
              label="Priority"
              value={task.priority}
              onChange={(p) => p !== null && update({ priority: p as Priority })}
              className="w-[236px] max-w-full"
              options={PRIORITIES.map((p) => ({
                id: p.id,
                label: p.short,
                icon: p.id ? <span className="size-2 rounded-full" style={{ background: PRIORITY_COLOR[p.id] }} /> : undefined,
              }))}
            />
          </Field>

          <Field label="List">
            <FieldButton ref={refs.list} onClick={() => toggle('list')} expanded={picking === 'list'}>
              <ListIcon size={15} style={{ color: list ? toneSolid(list.tone) : 'var(--color-inbox)' }} aria-hidden />
              <span className="text-ink">{list?.name ?? 'Inbox'}</span>
              <ChevronDown size={15} className="text-muted" aria-hidden />
            </FieldButton>
            <Popover open={picking === 'list'} onClose={() => setPicking(null)} anchorRef={refs.list} width={240} label="Move to list">
              <ul className="flex flex-col">
                {[null, ...lists].map((l) => {
                  const Icon = l ? LIST_ICONS[l.icon].icon : Inbox
                  return (
                    <li key={l?.id ?? 'inbox'}>
                      <MenuItem
                        leading={<Icon size={16} style={{ color: l ? toneSolid(l.tone) : 'var(--color-inbox)' }} aria-hidden />}
                        label={l?.name ?? 'Inbox'}
                        selected={(l?.id ?? null) === task.listId}
                        aria-current={(l?.id ?? null) === task.listId || undefined}
                        onClick={() => {
                          update({ listId: l?.id ?? null })
                          setPicking(null)
                        }}
                      />
                    </li>
                  )
                })}
                {lists.length === 0 && (
                  <li>
                    <MenuLabel>Create lists from the sidebar.</MenuLabel>
                  </li>
                )}
              </ul>
            </Popover>
          </Field>

          <Field label="Project">
            <Select
              size="sm"
              label="Project"
              value={task.projectId ?? ''}
              onChange={(e) => {
                const pid = e.target.value || null
                const p = projects.find((x) => x.id === pid)
                update({ projectId: pid, clientId: p?.clientId ?? null })
              }}
              options={[{ value: '', label: 'No project' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
              className="w-[240px] max-w-full"
            />
          </Field>

          <Field label="Assignee">
            <Select
              size="sm"
              label="Assignee"
              value={task.assigneeId ?? ''}
              onChange={(e) => update({ assigneeId: e.target.value || null })}
              options={[{ value: '', label: 'Unassigned' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
              className="w-[240px] max-w-full"
            />
          </Field>

          <Field label="Board">
            <SegmentedControl
              variant="solid"
              clearable={false}
              label="Task status"
              value={task.status}
              onChange={(s) => s && update({ status: s as TaskStatus })}
              options={TASK_STATUSES.map((s) => ({ id: s.id, label: s.label }))}
              className="w-[260px] max-w-full"
            />
          </Field>

          <Field label="Estimate">
            <span className="flex items-center gap-1.5">
              <TextInput
                size="sm"
                type="number"
                min={0}
                max={500}
                step={0.5}
                aria-label="Estimated hours"
                value={task.estimate ? String(task.estimate) : ''}
                onChange={(e) => update({ estimate: Math.max(0, Math.min(500, Number(e.target.value) || 0)) })}
                placeholder="0"
                className="!w-[76px]"
              />
              <span className="text-[13px] text-muted">hours</span>
            </span>
          </Field>

          <div className="flex min-h-[52px] items-center justify-between gap-3 py-1.5 pr-2 pl-4">
            <dt className="text-[14px] text-muted">Billable</dt>
            <dd>
              <Checkbox checked={task.billable} onChange={() => update({ billable: !task.billable })} label="Billable time" />
            </dd>
          </div>

          <div className="flex min-h-[52px] flex-wrap items-center gap-1.5 py-2 pr-2 pl-4">
            <dt className="mr-auto text-[14px] text-muted">Tags</dt>
            <dd className="flex flex-wrap items-center justify-end gap-1.5">
              {taskTags.map((t) => (
                <TagChip key={t.id} name={t.name} tone={t.tone} onRemove={() => update({ tags: task.tags.filter((x) => x !== t.id) })} />
              ))}
              <IconButton ref={refs.tags} label="Add tag" active={picking === 'tags'} onClick={() => toggle('tags')} aria-expanded={picking === 'tags'}>
                <Plus size={16} />
              </IconButton>
              <Popover open={picking === 'tags'} onClose={() => setPicking(null)} anchorRef={refs.tags} width={250} label="Tags">
                <TagPicker
                  tags={tags}
                  selected={task.tags}
                  onToggle={(id) => update({ tags: task.tags.includes(id) ? task.tags.filter((x) => x !== id) : [...task.tags, id] })}
                  onCreate={(name) => {
                    const tag = onCreateTag(name)
                    update({ tags: [...task.tags, tag.id] })
                  }}
                />
              </Popover>
            </dd>
          </div>
        </dl>

        <section className="mt-5 rounded-[16px] border border-line" aria-label="Time">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              <Clock3 size={15} className="text-muted" aria-hidden /> Time
            </h3>
            <span className="text-[12.5px] tabular-nums text-muted">
              {hoursLabel(logged)} logged{task.estimate > 0 ? ` · ${task.estimate}h estimated` : ''}
            </span>
          </div>
          {entries.length > 0 && (
            <ul className="mt-2 divide-y divide-line border-t border-line">
              {entries
                .slice(-3)
                .reverse()
                .map((e) => (
                  <li key={e.id} className="flex items-center gap-2 px-4 py-1.5 text-[13px]">
                    <span className="w-[46px] shrink-0 font-semibold tabular-nums text-ink">{hoursLabel(e.minutes)}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{e.note || dateLabel(e.date)}</span>
                    <span className="shrink-0 text-[11.5px] text-muted">
                      {members.find((m) => m.id === e.memberId)?.name.split(' ')[0] ?? 'Studio'}
                    </span>
                    <IconButton size="sm" label="Delete time entry" onClick={() => onRemoveTime(e.id)}>
                      <Trash2 size={13} />
                    </IconButton>
                  </li>
                ))}
            </ul>
          )}
          <form
            className="flex items-center gap-1.5 px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              const h = Number(logHours)
              if (!Number.isFinite(h) || h <= 0 || h > 24) return
              onLogTime(Math.round(h * 60), logNote.trim())
              setLogNote('')
              setLogHours('1')
            }}
          >
            <TextInput
              size="sm"
              type="number"
              min={0.25}
              max={24}
              step={0.25}
              aria-label="Hours to log"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              className="!w-[76px]"
            />
            <TextInput
              size="sm"
              aria-label="Time note"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="What did you do?"
              className="min-w-0 flex-1"
            />
            <Button size="sm" type="submit" variant="secondary">
              Log
            </Button>
          </form>
        </section>

        <Subtasks items={task.subtasks} onChange={(subtasks) => update({ subtasks })} />

        <label className="mt-5 block">
          <span className="sr-only">Notes</span>
          <TextArea value={task.notes} onChange={(e) => update({ notes: e.target.value })} placeholder={COPY.notesPlaceholder} rows={7} />
        </label>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
        <span className="text-[12.5px] text-muted">Created {created.format(task.createdAt)}</span>
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onRemove(task.id)} data-autofocus>
              Delete task
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        )}
      </footer>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 py-1.5 pr-2 pl-4">
      <dt className="shrink-0 text-[14px] text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center">{children}</dd>
    </div>
  )
}

const FieldButton = ({
  ref,
  onClick,
  expanded,
  children,
}: {
  ref: Ref<HTMLButtonElement>
  onClick: () => void
  expanded: boolean
  children: ReactNode
}) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className="hit-40 flex h-9 min-w-0 items-center gap-2 rounded-[10px] px-2.5 text-[14px] font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox"
  >
    {children}
  </button>
)
