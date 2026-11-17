import { ArrowRight, CalendarClock, CircleAlert, Clock3, ListChecks, Users, Wallet } from 'lucide-react'

import { motion } from 'motion/react'

import { toneSolid } from '../components/tones'
import { PIPELINE, PROJECT_STATUSES } from '../data'
import { attentionTasks, clientStats, deadlineProjects, memberLoad, projectHealth, projectStats, totals, weekLoad } from '../lib/agency'
import { dateLabel, hoursLabel, money, pct, relativeDue, weekdayLabel } from '../lib/format'
import { Avatar, EmptyHint, Panel, PanelHeading, Pill, ProgressBar, StatCard } from './agencyUi'
import { TaskLine } from './TaskLine'
import type { State, View } from './store'

type Props = {
  state: State
  onNavigate: (view: View) => void
  onOpenTask: (id: string) => void
  onToggleTask: (task: State['tasks'][number]) => void
}

const WEEK_TARGET_HOURS = 40
const statusMeta = (id: string) => PROJECT_STATUSES.find((s) => s.id === id) ?? PROJECT_STATUSES[0]

/** The studio at a glance: delivery, pipeline, and where the week went. */
export function OverviewView({ state, onNavigate, onOpenTask, onToggleTask }: Props) {
  const t = totals(state)
  const attention = attentionTasks(state, 5)
  const deadlines = deadlineProjects(state, 4)
  const load = weekLoad(state)
  const peak = Math.max(WEEK_TARGET_HOURS, ...load.map((d) => d.minutes / 60))
  const activeProjects = state.projects
    .filter((p) => PIPELINE.includes(p.status))
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
    .slice(0, 5)
  const activeClients = state.clients.filter((c) => c.status === 'active')
  const currency = state.prefs.currency
  const weekHours = Math.round((t.loggedMinutes / 60) * 10) / 10

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open tasks" value={t.openTasks} hint={`${t.dueThisWeek} due this week`} icon={ListChecks} tone="inbox" onClick={() => onNavigate({ kind: 'smart', id: 'today' })} />
        <StatCard label="Overdue" value={t.overdueTasks} hint={t.overdueTasks ? 'Needs a decision today' : 'Nothing slipping'} icon={CircleAlert} tone={t.overdueTasks ? 'rose' : 'green'} onClick={() => onNavigate({ kind: 'smart', id: 'today' })} />
        <StatCard label="Pipeline" value={money(t.pipelineValue, currency, true)} hint={`${t.activeProjects} live projects`} icon={Wallet} tone="upcoming" onClick={() => onNavigate({ kind: 'projects' })} />
        <StatCard label="Utilisation" value={`${t.utilization}%`} hint={`${weekHours}h of ${t.capacityHours}h booked`} icon={Clock3} tone="today" onClick={() => onNavigate({ kind: 'time' })} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="overflow-hidden">
            <PanelHeading
              title="Needs attention"
              hint="The next few deadlines, most pressing first."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate({ kind: 'smart', id: 'today' })}
                  className="hit-40 inline-flex items-center gap-1 rounded-[8px] text-[12.5px] font-semibold text-inbox-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox"
                >
                  All tasks <ArrowRight size={13} aria-hidden />
                </button>
              }
            />
            <div className="divide-y divide-line">
              {attention.map((task) => {
                const project = state.projects.find((p) => p.id === task.projectId)
                return (
                  <TaskLine
                    key={task.id}
                    task={task}
                    project={project}
                    client={state.clients.find((c) => c.id === (project?.clientId ?? task.clientId))}
                    member={state.members.find((m) => m.id === task.assigneeId)}
                    onOpen={() => onOpenTask(task.id)}
                    onToggle={() => onToggleTask(task)}
                  />
                )
              })}
              {attention.length === 0 && <div className="p-4"><EmptyHint>Nothing with a date is open. Enjoy the quiet.</EmptyHint></div>}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeading
              title="Projects in flight"
              hint="Progress by completed tasks and the time already logged."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate({ kind: 'projects' })}
                  className="hit-40 inline-flex items-center gap-1 rounded-[8px] text-[12.5px] font-semibold text-inbox-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox"
                >
                  All projects <ArrowRight size={13} aria-hidden />
                </button>
              }
            />
            <div className="divide-y divide-line">
              {activeProjects.map((project) => {
                const stats = projectStats(state, project.id)
                const health = projectHealth(state, project.id)
                const meta = statusMeta(project.status)
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onNavigate({ kind: 'project', id: project.id })}
                    className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-hover/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: toneSolid(meta.tone) }} />
                      <span className="min-w-0 truncate text-[14px] font-semibold text-ink">{project.name}</span>
                      <span className="ml-auto shrink-0">
                        <Pill label={health.label} tone={health.tone} />
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <ProgressBar value={stats.progress} tone={meta.tone} />
                      <span className="w-[68px] shrink-0 text-right text-[12px] tabular-nums text-muted">
                        {stats.doneTasks}/{stats.totalTasks}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-muted">
                      <span className="truncate">{state.clients.find((c) => c.id === project.clientId)?.name ?? 'No client'}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{project.due ? dateLabel(project.due) : 'No date'}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0 tabular-nums">{hoursLabel(stats.loggedMinutes)} logged</span>
                    </div>
                  </button>
                )
              })}
              {activeProjects.length === 0 && <div className="p-4"><EmptyHint>No live projects. Create one from the Projects screen.</EmptyHint></div>}
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel>
            <PanelHeading title="This week" hint={`${weekHours}h logged · ${money(t.billableValue, currency, true)} billable`} />
            <div className="flex items-end gap-1.5 px-5 pt-1 pb-4" aria-hidden>
              {load.map((d) => {
                const h = d.minutes / 60
                return (
                  <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-[64px] w-full items-end">
                      <motion.div
                        className="w-full rounded-[5px]"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h > 0 ? 6 : 2, (h / peak) * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                        style={{ background: h > 0 ? 'linear-gradient(180deg, var(--color-inbox-2), var(--color-inbox))' : 'var(--color-line)' }}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold text-muted">{weekdayLabel(d.day)}</span>
                    <span className="text-[10.5px] tabular-nums text-muted">{h > 0 ? `${Math.round(h * 10) / 10}` : '·'}</span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeading
              title="Team load"
              hint="Hours logged this week against capacity."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate({ kind: 'team' })}
                  className="hit-40 grid size-7 place-items-center rounded-[8px] text-muted hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-inbox"
                  aria-label="Open the team"
                >
                  <Users size={15} />
                </button>
              }
            />
            <ul className="divide-y divide-line pb-1">
              {state.members.slice(0, 4).map((member) => {
                const m = memberLoad(state, member.id)
                const tone = m.load > 100 ? 'rose' : m.load > 85 ? 'today' : 'green'
                return (
                  <li key={member.id} className="flex items-center gap-2.5 px-4 py-2">
                    <Avatar member={member} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-ink">{member.name}</span>
                        <span className="ml-auto shrink-0 text-[11.5px] tabular-nums text-muted">
                          {m.hours}/{m.capacity}h
                        </span>
                      </div>
                      <div className="mt-1">
                        <ProgressBar value={pct(m.hours, m.capacity)} tone={tone} height={4} />
                      </div>
                    </div>
                  </li>
                )
              })}
              {state.members.length === 0 && <li className="px-4 pb-3"><EmptyHint>Add your team to track capacity.</EmptyHint></li>}
            </ul>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeading title="Deadlines" hint={`${money(t.retainerValue, currency, true)} a month on retainer`} />
            <ul className="divide-y divide-line pb-1">
              {deadlines.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate({ kind: 'project', id: project.id })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-hover/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox"
                  >
                    <CalendarClock size={14} className="shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{project.name}</span>
                    <span className="shrink-0 text-[11.5px] text-muted">{relativeDue(project.due)}</span>
                  </button>
                </li>
              ))}
              {deadlines.length === 0 && <li className="px-4 pb-3"><EmptyHint>No project has a deadline yet.</EmptyHint></li>}
            </ul>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeading title="Clients" hint={`${activeClients.length} active`} />
            <ul className="divide-y divide-line pb-1">
              {activeClients.slice(0, 4).map((client) => {
                const stats = clientStats(state, client.id)
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate({ kind: 'client', id: client.id })}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-hover/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox"
                    >
                      <span className="size-2 shrink-0 rounded-full" style={{ background: toneSolid(client.tone) }} />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{client.name}</span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-muted">{stats.openTasks} open</span>
                    </button>
                  </li>
                )
              })}
              {activeClients.length === 0 && <li className="px-4 pb-3"><EmptyHint>No active clients yet.</EmptyHint></li>}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
