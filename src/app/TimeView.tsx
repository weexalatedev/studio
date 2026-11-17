import { Clock3, Plus, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { IconButton } from '../components/IconButton'
import { Select } from '../components/Select'
import { TextInput } from '../components/TextField'
import { toneSolid } from '../components/tones'
import { todayKey } from '../lib/dates'
import { memberLoad, totals } from '../lib/agency'
import { dateLabel, hoursLabel, money, weekdayLabel, weekDays, weekStart } from '../lib/format'
import { Avatar, EmptyHint, Field, Panel, PanelHeading, Pill, ProgressBar, StatCard } from './agencyUi'
import type { Actions, State } from './store'

type Props = { state: State; actions: Actions }

/** Timesheet: log hours against projects and read the week back. */
export function TimeView({ state, actions }: Props) {
  const t = totals(state)
  const currency = state.prefs.currency
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '')
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? '')
  const [date, setDate] = useState(todayKey())
  const [hours, setHours] = useState('1')
  const [note, setNote] = useState('')
  const [billable, setBillable] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const week = new Set(weekDays())
  const billableMinutes = state.time.filter((e) => week.has(e.date) && e.billable).reduce((n, e) => n + e.minutes, 0)

  const grouped = useMemo(() => {
    const sorted = [...state.time].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    const by = new Map<string, typeof state.time>()
    for (const e of sorted) by.set(e.date, [...(by.get(e.date) ?? []), e])
    return [...by.entries()]
  }, [state.time])

  const valueOf = (minutes: number, projectId: string | null) => {
    const project = projectId ? state.projects.find((p) => p.id === projectId) : null
    return (minutes / 60) * (project?.rate || state.prefs.defaultRate)
  }

  const submit = () => {
    const h = Number(hours)
    if (!Number.isFinite(h) || h <= 0) return setError('Enter hours greater than zero.')
    if (h > 24) return setError('One entry can log at most 24 hours.')
    actions.logTime({
      taskId: null,
      projectId: projectId || null,
      memberId: memberId || null,
      date,
      minutes: Math.round(h * 60),
      note: note.trim(),
      billable,
    })
    setNote('')
    setHours('1')
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="This week" value={`${t.bookedHours}h`} hint={`of ${t.capacityHours}h capacity`} icon={Clock3} tone="inbox" />
        <StatCard label="Billable" value={hoursLabel(billableMinutes)} hint={`${t.utilization}% utilisation`} icon={Wallet} tone="green" />
        <StatCard label="Billable value" value={money(t.billableValue, currency, true)} hint="priced at project rates" tone="upcoming" />
        <StatCard label="Entries" value={state.time.length} hint={`week of ${dateLabel(weekStart())}`} tone="teal" />
      </div>

      <Panel>
        <PanelHeading title="Log time" hint="Hours are priced at the project rate; edit a project to change it." />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="grid gap-3 px-5 pt-1 pb-5 sm:grid-cols-2 lg:grid-cols-12"
        >
          <div className="lg:col-span-3">
            <Field label="Person">
              <Select
                label="Person"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                options={[{ value: '', label: 'Unassigned' }, ...state.members.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </Field>
          </div>
          <div className="lg:col-span-4">
            <Field label="Project">
              <Select
                label="Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={[{ value: '', label: 'No project (studio time)' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]}
              />
            </Field>
          </div>
          <div className="lg:col-span-2">
            <Field label="Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <div className="lg:col-span-1">
            <Field label="Hours">
              <TextInput type="number" min={0.25} max={24} step={0.25} value={hours} onChange={(e) => setHours(e.target.value)} />
            </Field>
          </div>
          <div className="lg:col-span-2">
            <Field label="Note">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" maxLength={200} />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-12">
            <Checkbox checked={billable} onChange={() => setBillable((b) => !b)} label="Billable" />
            <div className="flex items-center gap-2">
              {error && (
                <p role="alert" className="text-[13px] text-danger-ink">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary">
                <Plus size={15} /> Log entry
              </Button>
            </div>
          </div>
        </form>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Panel>
          <PanelHeading title="By person" hint="Hours logged this week." />
          <ul className="flex flex-col gap-3 px-5 pt-1 pb-5">
            {state.members.map((member) => {
              const load = memberLoad(state, member.id)
              const tone = load.load > 100 ? 'rose' : load.load > 85 ? 'today' : 'green'
              return (
                <li key={member.id} className="flex items-center gap-2.5">
                  <Avatar member={member} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink">{member.name}</span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-muted">
                        {load.hours}h / {load.capacity}h
                      </span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar value={load.load} tone={tone} height={4} />
                    </div>
                  </div>
                </li>
              )
            })}
            {state.members.length === 0 && <li><EmptyHint>No team yet. Add people on the Team screen.</EmptyHint></li>}
          </ul>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeading title="Entries" hint="Newest first. Delete an entry to correct a mistake." />
          <div className="max-h-[520px] overflow-y-auto">
            {grouped.map(([day, entries]) => (
              <section key={day} aria-label={dateLabel(day)}>
                <h3 className="sticky top-0 z-10 flex items-center gap-2 bg-white/95 px-4 py-1.5 text-[11.5px] font-semibold text-muted backdrop-blur">
                  {weekdayLabel(day)} · {dateLabel(day)}
                  <span className="ml-auto tabular-nums">{hoursLabel(entries.reduce((n, e) => n + e.minutes, 0))}</span>
                </h3>
                <ul className="divide-y divide-line">
                  {entries.map((entry) => {
                    const member = state.members.find((m) => m.id === entry.memberId)
                    const project = state.projects.find((p) => p.id === entry.projectId)
                    const client = project ? state.clients.find((c) => c.id === project.clientId) : null
                    return (
                      <li key={entry.id} className="group flex items-center gap-2.5 px-4 py-2">
                        <Avatar member={member} size={24} />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-[13px] text-ink">{project?.name ?? 'Studio time'}</span>
                            {client && (
                              <span className="hidden shrink-0 items-center gap-1 text-[11.5px] text-muted sm:inline-flex">
                                <span className="size-1.5 rounded-full" style={{ background: toneSolid(client.tone) }} />
                                {client.name}
                              </span>
                            )}
                          </div>
                          {entry.note && <p className="truncate text-[11.5px] text-muted">{entry.note}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {entry.billable && <Pill label="Billable" tone="green" dot={false} />}
                          <span className="w-[42px] text-right text-[12.5px] font-semibold tabular-nums text-ink">{hoursLabel(entry.minutes)}</span>
                          <IconButton
                            size="sm"
                            label="Delete time entry"
                            onClick={() => actions.removeTime(entry.id)}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
            {state.time.length === 0 && <div className="p-4"><EmptyHint>No time logged yet. Add an entry above.</EmptyHint></div>}
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[12.5px] text-muted">
            <span>All time</span>
            <span className="font-semibold tabular-nums text-ink">
              {hoursLabel(state.time.reduce((n, e) => n + e.minutes, 0))} ·{' '}
              {money(state.time.filter((e) => e.billable).reduce((n, e) => n + valueOf(e.minutes, e.projectId), 0), currency, true)}
            </span>
          </div>
        </Panel>
      </div>
    </div>
  )
}
