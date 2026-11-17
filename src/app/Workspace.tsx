import { Building2, Clock3, FolderKanban, LayoutDashboard, Users, type LucideIcon } from 'lucide-react'

import type { Tone } from '../data'
import { ClientsView } from './ClientsView'
import { OverviewView } from './OverviewView'
import { ProjectsView } from './ProjectsView'
import { TeamView } from './TeamView'
import { TimeView } from './TimeView'
import type { Actions, State, Task, View } from './store'

export type StudioMeta = { title: string; icon: LucideIcon; tone: Tone }

/** Title and mark for the studio screens; null for task views (App owns those). */
export function studioMeta(view: View, state: State): StudioMeta | null {
  switch (view.kind) {
    case 'overview':
      return { title: 'Overview', icon: LayoutDashboard, tone: 'inbox' }
    case 'clients':
      return { title: 'Clients', icon: Building2, tone: 'teal' }
    case 'client':
      return { title: state.clients.find((c) => c.id === view.id)?.name ?? 'Client', icon: Building2, tone: 'teal' }
    case 'projects':
      return { title: 'Projects', icon: FolderKanban, tone: 'upcoming' }
    case 'project':
      return { title: state.projects.find((p) => p.id === view.id)?.name ?? 'Project', icon: FolderKanban, tone: 'upcoming' }
    case 'team':
      return { title: 'Team', icon: Users, tone: 'rose' }
    case 'time':
      return { title: 'Timesheet', icon: Clock3, tone: 'green' }
    default:
      return null
  }
}

type Props = {
  state: State
  actions: Actions
  view: View
  onNavigate: (view: View) => void
  onOpenTask: (id: string) => void
  onToggleTask: (task: Task) => void
}

/** The studio screens: overview, clients, projects, team and time. */
export function Workspace({ state, actions, view, onNavigate, onOpenTask, onToggleTask }: Props) {
  switch (view.kind) {
    case 'overview':
      return <OverviewView state={state} onNavigate={onNavigate} onOpenTask={onOpenTask} onToggleTask={onToggleTask} />
    case 'clients':
    case 'client':
      return (
        <ClientsView
          state={state}
          actions={actions}
          view={view}
          onNavigate={onNavigate}
          onOpenTask={onOpenTask}
          onToggleTask={onToggleTask}
        />
      )
    case 'projects':
    case 'project':
      return (
        <ProjectsView
          state={state}
          actions={actions}
          view={view}
          onNavigate={onNavigate}
          onOpenTask={onOpenTask}
          onToggleTask={onToggleTask}
        />
      )
    case 'team':
      return <TeamView state={state} actions={actions} />
    case 'time':
      return <TimeView state={state} actions={actions} />
    default:
      return null
  }
}
