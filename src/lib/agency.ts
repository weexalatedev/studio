// Derived studio numbers: project budgets, client health, team load.
// Everything is computed from State so screens never store their own copies.

import type { State, Task } from '../app/store'
import type { Tone } from '../data'
import { daysFromToday, todayKey } from './dates'
import { weekDays } from './format'

export type ProjectStats = {
  /** Minutes logged against the project, billable or not. */
  loggedMinutes: number
  /** Minutes logged this week. */
  weekMinutes: number
  /** Billable minutes priced at the project rate. */
  value: number
  estimateMinutes: number
  budgetUsed: number
  openTasks: number
  doneTasks: number
  totalTasks: number
  /** Completed share of all tasks, 0–100. */
  progress: number
}

export type Health = { label: string; tone: Tone }

export function projectTasks(state: State, projectId: string): Task[] {
  return state.tasks.filter((t) => t.projectId === projectId)
}

export function projectStats(state: State, projectId: string): ProjectStats {
  const tasks = projectTasks(state, projectId)
  const entries = state.time.filter((e) => e.projectId === projectId)
  const week = new Set(weekDays())
  const loggedMinutes = entries.reduce((n, e) => n + e.minutes, 0)
  const weekMinutes = entries.reduce((n, e) => (week.has(e.date) ? n + e.minutes : n), 0)
  const project = state.projects.find((p) => p.id === projectId)
  const rate = project?.rate || state.prefs.defaultRate
  const value = entries.reduce((n, e) => (e.billable ? n + (e.minutes / 60) * rate : n), 0)
  const doneTasks = tasks.filter((t) => t.done).length
  const totalTasks = tasks.length
  return {
    loggedMinutes,
    weekMinutes,
    value,
    estimateMinutes: tasks.reduce((n, t) => n + t.estimate * 60, 0),
    budgetUsed: project?.budget ? Math.round((value / project.budget) * 100) : 0,
    openTasks: totalTasks - doneTasks,
    doneTasks,
    totalTasks,
    progress: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
  }
}

/** A project's status line: at risk when work is due soon and barely started. */
export function projectHealth(state: State, projectId: string): Health {
  const project = state.projects.find((p) => p.id === projectId)
  if (!project) return { label: 'Unknown', tone: 'slate' }
  if (project.status === 'launched') return { label: 'Launched', tone: 'green' }
  if (project.status === 'archived') return { label: 'Archived', tone: 'slate' }
  const stats = projectStats(state, projectId)
  if (!project.due) return { label: 'No deadline', tone: 'slate' }
  const left = daysFromToday(project.due)
  if (left < 0) return { label: 'Overdue', tone: 'rose' }
  if (left <= 7 && stats.progress < 60) return { label: 'At risk', tone: 'today' }
  return { label: 'On track', tone: 'green' }
}

export type ClientStats = {
  openTasks: number
  overdueTasks: number
  projects: number
  activeProjects: number
  loggedMinutes: number
  weekMinutes: number
  /** Retainer for the month plus billable work inside active projects. */
  retainer: number
}

export function clientStats(state: State, clientId: string): ClientStats {
  const projects = state.projects.filter((p) => p.clientId === clientId)
  const projectIds = new Set(projects.map((p) => p.id))
  const tasks = state.tasks.filter((t) => t.clientId === clientId || (t.projectId && projectIds.has(t.projectId)))
  const entries = state.time.filter((e) => (e.projectId ? projectIds.has(e.projectId) : false))
  const week = new Set(weekDays())
  const client = state.clients.find((c) => c.id === clientId)
  return {
    openTasks: tasks.filter((t) => !t.done).length,
    overdueTasks: tasks.filter((t) => !t.done && t.due && daysFromToday(t.due) < 0).length,
    projects: projects.length,
    activeProjects: projects.filter((p) => p.status !== 'archived' && p.status !== 'launched').length,
    loggedMinutes: entries.reduce((n, e) => n + e.minutes, 0),
    weekMinutes: entries.reduce((n, e) => (week.has(e.date) ? n + e.minutes : n), 0),
    retainer: client?.retainer ?? 0,
  }
}

export type MemberLoad = {
  hours: number
  capacity: number
  /** Share of the week's capacity already logged, 0–100+. */
  load: number
  openTasks: number
}

export function memberLoad(state: State, memberId: string): MemberLoad {
  const member = state.members.find((m) => m.id === memberId)
  const week = new Set(weekDays())
  const minutes = state.time.reduce((n, e) => (e.memberId === memberId && week.has(e.date) ? n + e.minutes : n), 0)
  const capacity = member?.capacity ?? 0
  const hours = Math.round((minutes / 60) * 10) / 10
  return {
    hours,
    capacity,
    load: capacity ? Math.round((hours / capacity) * 100) : 0,
    openTasks: state.tasks.filter((t) => t.assigneeId === memberId && !t.done).length,
  }
}

export type Totals = {
  activeProjects: number
  openTasks: number
  overdueTasks: number
  dueThisWeek: number
  pipelineValue: number
  loggedMinutes: number
  billableValue: number
  bookedHours: number
  capacityHours: number
  utilization: number
  retainerValue: number
}

/** The numbers on the overview: pipeline, delivery and the week's capacity. */
export function totals(state: State): Totals {
  const week = new Set(weekDays())
  const open = state.tasks.filter((t) => !t.done)
  const pipeline = state.projects.filter((p) => p.status !== 'archived' && p.status !== 'launched')
  const entries = state.time.filter((e) => week.has(e.date))
  const bookedMinutes = entries.reduce((n, e) => n + e.minutes, 0)
  const capacityHours = state.members.reduce((n, m) => n + m.capacity, 0)
  const billableValue = entries.reduce((n, e) => {
    if (!e.billable) return n
    const project = e.projectId ? state.projects.find((p) => p.id === e.projectId) : null
    return n + (e.minutes / 60) * (project?.rate || state.prefs.defaultRate)
  }, 0)
  return {
    activeProjects: state.projects.filter((p) => p.status !== 'archived' && p.status !== 'launched').length,
    openTasks: open.length,
    overdueTasks: open.filter((t) => t.due && daysFromToday(t.due) < 0).length,
    dueThisWeek: open.filter((t) => t.due && daysFromToday(t.due) >= 0 && daysFromToday(t.due) <= 7).length,
    pipelineValue: pipeline.reduce((n, p) => n + p.budget, 0),
    loggedMinutes: bookedMinutes,
    billableValue,
    bookedHours: Math.round((bookedMinutes / 60) * 10) / 10,
    capacityHours,
    utilization: capacityHours ? Math.round((bookedMinutes / 60 / capacityHours) * 100) : 0,
    retainerValue: state.clients.filter((c) => c.status === 'active').reduce((n, c) => n + c.retainer, 0),
  }
}

/** Open tasks sorted by what needs attention first. */
export function attentionTasks(state: State, limit = 6): Task[] {
  const today = todayKey()
  return state.tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => (a.due ?? today).localeCompare(b.due ?? today) || b.priority - a.priority)
    .slice(0, limit)
}

/** Projects with a deadline, soonest first. */
export function deadlineProjects(state: State, limit = 5) {
  return state.projects
    .filter((p) => p.due && p.status !== 'archived' && p.status !== 'launched')
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
    .slice(0, limit)
}

/** Minutes per day for the current week, Monday first. */
export function weekLoad(state: State, memberId?: string): { day: string; minutes: number }[] {
  return weekDays().map((day) => ({
    day,
    minutes: state.time.reduce(
      (n, e) => (e.date === day && (!memberId || e.memberId === memberId) ? n + e.minutes : n),
      0,
    ),
  }))
}
