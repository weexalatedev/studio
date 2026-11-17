import {
  Building2,
  CalendarRange,
  CircleCheckBig,
  Clock3,
  Download,
  FolderKanban,
  Hash,
  Image,
  LayoutDashboard,
  ListPlus,
  ListTodo,
  Palette,
  PanelLeft,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AddTaskBar } from './app/AddTaskBar'
import { CommandPalette, type Command } from './app/CommandPalette'
import { CompletedView } from './app/CompletedView'
import { SIDEBAR_WIDTH, SMART_ICONS, Sidebar } from './app/Sidebar'
import { SettingsSheet } from './app/SettingsSheet'
import { TagFilter } from './app/TagFilter'
import { TaskDrawer } from './app/TaskDrawer'
import { TaskView, groupOpen, type Empty } from './app/TaskView'
import { Workspace, studioMeta } from './app/Workspace'
import { DragProvider, type DropTarget } from './app/dnd'
import { LIST_ICONS } from './app/listIcons'
import {
  bucketOf,
  defaultsFor,
  dropPatch,
  inView,
  isTaskView,
  nextDue,
  useStudio,
  type Task,
  type View,
} from './app/store'
import { IconButton } from './components/IconButton'
import { IconChip } from './components/IconChip'
import { Scenery } from './components/Scenery'
import { SegmentedControl } from './components/SegmentedControl'
import { Toast, type ToastData } from './components/Toast'
import { isOverlayOpen } from './components/useOverlay'
import { BACKGROUND_PHOTO, COPY, DATE_FILTERS, LIST_EMPTY, SCENES, SMART_LISTS, type SceneId, type Tone } from './data'
import { shortLabel, type DateBucket } from './lib/dates'
import { downloadExport } from './lib/io'
import { EASE_OUT } from './lib/motion'
import { parseQuickAdd } from './lib/quickAdd'
import { navigate } from './router'

type DateFilter = (typeof DATE_FILTERS)[number]['id']

const COMPLETE_DELAY = 650
const TOAST_MS = 4500

function useIsNarrow() {
  const query = '(max-width: 767px)'
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}

function matchesFilter(due: string | null, filter: DateFilter | null): boolean {
  if (!filter) return true
  const b: DateBucket = bucketOf(due)
  return filter === 'today' ? b === 'today' || b === 'overdue' : b === filter
}

export function App() {
  const { state, actions } = useStudio()
  const narrow = useIsNarrow()
  const [view, setView] = useState<View>({ kind: 'overview' })
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addingList, setAddingList] = useState(false)
  const [completing, setCompleting] = useState<Set<string>>(() => new Set())
  const [toast, setToast] = useState<ToastData | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLInputElement>(null)
  const timers = useRef(new Map<string, number>())

  const sidebarOpen = narrow ? mobileOpen : !collapsed
  const searching = query.trim().length > 0
  const taskView = isTaskView(view)
  const isCompletedView = !searching && view.kind === 'smart' && view.id === 'completed'

  const notify = useCallback((message: ToastData['message'], action?: ToastData['action'], tone?: ToastData['tone']) => {
    setToast({ key: Date.now(), message, action, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [toast])

  // A canvas that disappears can't stay selected.
  useEffect(() => {
    if (view.kind === 'list' && !state.lists.some((l) => l.id === view.id)) setView({ kind: 'overview' })
    if (view.kind === 'client' && !state.clients.some((c) => c.id === view.id)) setView({ kind: 'clients' })
    if (view.kind === 'project' && !state.projects.some((p) => p.id === view.id)) setView({ kind: 'projects' })
  }, [state.lists, state.clients, state.projects, view])

  // Tags that disappear drop out of the filter.
  useEffect(() => {
    setTagFilter((f) => (f.every((id) => state.tags.some((t) => t.id === id)) ? f : f.filter((id) => state.tags.some((t) => t.id === id))))
  }, [state.tags])

  const showSidebar = useCallback(
    (open: boolean) => {
      if (narrow) setMobileOpen(open)
      else setCollapsed(!open)
    },
    [narrow],
  )

  const selectView = useCallback(
    (v: View) => {
      setView(v)
      setQuery('')
      setDateFilter(null)
      setTagFilter([])
      if (narrow) setMobileOpen(false)
    },
    [narrow],
  )

  // ---- What the main column shows -------------------------------------------------
  const { base, open, done, viewTags } = useMemo(() => {
    if (!taskView) return { base: [] as Task[], open: [] as Task[], done: [] as Task[], viewTags: [] }
    const q = query.trim().toLowerCase()
    const base = state.tasks.filter((t) => (q ? `${t.title}\n${t.notes}`.toLowerCase().includes(q) : inView(t, view)))
    const usedTags = new Set(base.flatMap((t) => t.tags))
    const filtered = base.filter((t) => matchesFilter(t.due, dateFilter) && (tagFilter.length === 0 || t.tags.some((id) => tagFilter.includes(id))))
    return {
      base,
      open: filtered.filter((t) => !t.done),
      done: filtered.filter((t) => t.done),
      viewTags: state.tags.filter((t) => usedTags.has(t.id)),
    }
  }, [state.tasks, state.tags, view, taskView, query, dateFilter, tagFilter])

  const current = useMemo(() => {
    if (searching) return { title: COPY.searchTitle, icon: Search, tone: 'slate' as Tone, filled: false }
    const studio = studioMeta(view, state)
    if (studio) return { ...studio, filled: false }
    if (view.kind === 'list') {
      const l = state.lists.find((x) => x.id === view.id)
      return { title: l?.name ?? '', icon: l ? LIST_ICONS[l.icon].icon : ListTodo, tone: l?.tone ?? ('slate' as Tone), filled: false }
    }
    if (view.kind === 'smart') {
      const s = SMART_LISTS.find((x) => x.id === view.id)!
      return { title: s.name, icon: SMART_ICONS[s.id], tone: s.tone, filled: s.id === 'starred' }
    }
    return { title: '', icon: ListTodo, tone: 'slate' as Tone, filled: false }
  }, [searching, view, state])

  const empty: Empty = useMemo(() => {
    if (searching) return { title: 'No matches', body: `${COPY.noResults} “${query.trim()}”.`, tone: 'slate', done: false }
    if (view.kind !== 'smart' && view.kind !== 'list') return { title: '', body: '', tone: 'slate', done: false }
    if (dateFilter || tagFilter.length)
      return { title: 'Nothing here', body: 'No open tasks match this filter. Clear it to see everything.', tone: current.tone, done: false }
    const copy = view.kind === 'list' ? LIST_EMPTY : SMART_LISTS.find((s) => s.id === view.id)!.empty
    const allDone = base.some((t) => t.done)
    return { title: allDone ? copy.doneTitle : copy.title, body: allDone ? copy.doneBody : copy.body, tone: current.tone, done: allDone }
  }, [searching, query, dateFilter, tagFilter, view, base, current.tone])

  // ---- Completing ------------------------------------------------------------------
  const finishToggle = useCallback(
    (task: Task) => {
      actions.toggleTask(task.id)
      const next = task.repeat ? ` · next ${shortLabel(nextDue(task))}` : ''
      notify(
        <>
          Completed <span className="font-semibold">{task.title}</span>
          {next}
        </>,
        { label: 'Undo', run: () => actions.toggleTask(task.id) },
      )
    },
    [actions, notify],
  )

  const toggle = useCallback(
    (task: Task) => {
      // Un-completing is immediate.
      if (task.done) {
        actions.toggleTask(task.id)
        notify(
          <>
            Restored <span className="font-semibold">{task.title}</span>
          </>,
        )
        return
      }
      // Completing plays the tick and strike first, then the row moves.
      if (completing.has(task.id)) {
        window.clearTimeout(timers.current.get(task.id))
        timers.current.delete(task.id)
        setCompleting((s) => {
          const n = new Set(s)
          n.delete(task.id)
          return n
        })
        return
      }
      setCompleting((s) => new Set(s).add(task.id))
      const timer = window.setTimeout(() => {
        timers.current.delete(task.id)
        setCompleting((s) => {
          const n = new Set(s)
          n.delete(task.id)
          return n
        })
        finishToggle(task)
      }, COMPLETE_DELAY)
      timers.current.set(task.id, timer)
    },
    [actions, completing, finishToggle, notify],
  )

  // ---- Reordering and drag and drop --------------------------------------------------
  const placeNear = useCallback(
    (task: Task, anchor: Task, place: 'before' | 'after') => {
      const group = groupOpen(open).find((g) => g.tasks.some((t) => t.id === anchor.id))
      const siblings = (group?.tasks ?? []).filter((t) => t.id !== task.id && t.due === anchor.due)
      const i = siblings.findIndex((t) => t.id === anchor.id) + (place === 'after' ? 1 : 0)
      const prev = siblings[i - 1]
      const next = siblings[i]
      const order = prev && next ? (prev.order + next.order) / 2 : prev ? prev.order + 1 : next ? next.order - 1 : Date.now()
      actions.updateTask(task.id, { order, due: anchor.due })
    },
    [actions, open],
  )

  const onDrop = useCallback(
    (task: Task, target: DropTarget) => {
      if (target.kind === 'row') {
        const anchor = state.tasks.find((t) => t.id === target.id)
        if (anchor) placeNear(task, anchor, target.place)
        return
      }
      const dropped = target.view
      const patch = dropPatch(task, dropped)
      const name =
        dropped.kind === 'list'
          ? state.lists.find((l) => l.id === dropped.id)?.name
          : dropped.kind === 'smart'
            ? SMART_LISTS.find((s) => s.id === dropped.id)?.name
            : undefined
      if (patch === null) {
        notify(`Already in ${name ?? 'that view'}`)
        return
      }
      if (patch === 'complete') {
        finishToggle(task)
        return
      }
      const before: Partial<Task> = Object.fromEntries(Object.keys(patch).map((k) => [k, task[k as keyof Task]]))
      actions.updateTask(task.id, patch)
      notify(
        <>
          Moved <span className="font-semibold">{task.title}</span> to {name}
        </>,
        { label: 'Undo', run: () => actions.updateTask(task.id, before) },
      )
    },
    [state.tasks, state.lists, placeNear, actions, notify, finishToggle],
  )

  const onMove = useCallback(
    (task: Task, dir: -1 | 1, siblings: Task[]) => {
      const i = siblings.findIndex((t) => t.id === task.id)
      const neighbor = siblings[i + dir]
      if (!neighbor) return
      if (neighbor.due === task.due) {
        actions.updateTask(task.id, { order: neighbor.order })
        actions.updateTask(neighbor.id, { order: task.order })
      } else {
        actions.updateTask(task.id, { due: neighbor.due, order: neighbor.order + dir * 0.5 })
      }
    },
    [actions],
  )

  // ---- Commands --------------------------------------------------------------------
  const setScene = useCallback((scene: SceneId) => actions.setPrefs({ scene }), [actions])

  const focusAdd = useCallback(() => {
    if (isCompletedView || !taskView) selectView({ kind: 'smart', id: 'inbox' })
    requestAnimationFrame(() => addRef.current?.focus())
  }, [isCompletedView, taskView, selectView])

  const focusSearch = useCallback(() => {
    showSidebar(true)
    requestAnimationFrame(() => requestAnimationFrame(() => searchRef.current?.focus()))
  }, [showSidebar])

  const clearCompleted = useCallback(() => {
    const doneTasks = state.tasks.filter((t) => t.done)
    if (!doneTasks.length) return
    actions.removeTasks(doneTasks.map((t) => t.id))
    notify(`Cleared ${doneTasks.length} completed ${doneTasks.length === 1 ? 'task' : 'tasks'}`, {
      label: 'Undo',
      run: () => actions.restoreTasks(doneTasks),
    })
  }, [state.tasks, actions, notify])

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: 'new-task', group: 'Actions', label: 'New task', icon: Plus, hint: 'N', run: focusAdd },
      {
        id: 'new-list',
        group: 'Actions',
        label: 'New list',
        icon: ListPlus,
        run: () => {
          showSidebar(true)
          setAddingList(true)
        },
      },
      { id: 'search', group: 'Actions', label: 'Search tasks', icon: Search, hint: '/', run: focusSearch },
      { id: 'sidebar', group: 'Actions', label: sidebarOpen ? 'Hide sidebar' : 'Show sidebar', icon: PanelLeft, hint: '[', run: () => showSidebar(!sidebarOpen) },
      { id: 'settings', group: 'Actions', label: 'Open settings', icon: Settings, run: () => setSettingsOpen(true) },
      { id: 'clear-done', group: 'Actions', label: 'Clear completed tasks', keywords: 'delete done', icon: Trash2, run: clearCompleted },
      { id: 'export', group: 'Actions', label: 'Export JSON', keywords: 'backup download', icon: Download, run: () => downloadExport(state) },
      { id: 'import', group: 'Actions', label: 'Import JSON…', keywords: 'restore upload', icon: Upload, run: () => setSettingsOpen(true) },
      { id: 'styleguide', group: 'Actions', label: 'Open style guide', keywords: 'design system tokens', icon: Palette, run: () => navigate('/styleguide') },
      {
        id: 'go-overview',
        group: 'Studio',
        label: 'Overview',
        leading: <IconChip icon={LayoutDashboard} tone="inbox" size={22} />,
        run: () => selectView({ kind: 'overview' }),
      },
      {
        id: 'go-clients',
        group: 'Studio',
        label: 'Clients',
        leading: <IconChip icon={Building2} tone="teal" size={22} />,
        keywords: 'accounts',
        run: () => selectView({ kind: 'clients' }),
      },
      {
        id: 'go-projects',
        group: 'Studio',
        label: 'Projects',
        leading: <IconChip icon={FolderKanban} tone="upcoming" size={22} />,
        keywords: 'jobs engagements',
        run: () => selectView({ kind: 'projects' }),
      },
      {
        id: 'go-team',
        group: 'Studio',
        label: 'Team',
        leading: <IconChip icon={Users} tone="rose" size={22} />,
        keywords: 'people capacity',
        run: () => selectView({ kind: 'team' }),
      },
      {
        id: 'go-time',
        group: 'Studio',
        label: 'Timesheet',
        leading: <IconChip icon={Clock3} tone="green" size={22} />,
        keywords: 'time hours billing',
        run: () => selectView({ kind: 'time' }),
      },
      ...SMART_LISTS.map((s) => ({
        id: `go-${s.id}`,
        group: 'Smart lists',
        label: s.name,
        leading: <IconChip icon={SMART_ICONS[s.id]} tone={s.tone} size={22} filled={s.id === 'starred'} />,
        run: () => selectView({ kind: 'smart', id: s.id }),
      })),
      ...state.lists.map((l) => ({
        id: `go-list-${l.id}`,
        group: 'Lists',
        label: l.name,
        keywords: 'list',
        leading: <IconChip icon={LIST_ICONS[l.icon].icon} tone={l.tone} size={22} />,
        run: () => selectView({ kind: 'list', id: l.id }),
      })),
      ...state.projects.map((p) => ({
        id: `go-project-${p.id}`,
        group: 'Projects',
        label: p.name,
        keywords: `${state.clients.find((c) => c.id === p.clientId)?.name ?? ''} project`,
        leading: <IconChip icon={FolderKanban} tone="upcoming" size={22} />,
        hint: state.clients.find((c) => c.id === p.clientId)?.name,
        run: () => selectView({ kind: 'project', id: p.id }),
      })),
      ...state.clients.map((c) => ({
        id: `go-client-${c.id}`,
        group: 'Clients',
        label: c.name,
        keywords: 'client account',
        leading: <IconChip icon={Building2} tone={c.tone} size={22} />,
        run: () => selectView({ kind: 'client', id: c.id }),
      })),
      ...SCENES.map((s) => ({
        id: `scene-${s.id}`,
        group: 'Background',
        label: `${s.name} background`,
        keywords: 'scene theme wallpaper',
        icon: Image,
        hint: state.prefs.scene === s.id ? 'Current' : undefined,
        run: () => setScene(s.id),
      })),
      ...DATE_FILTERS.map((f) => ({
        id: `date-${f.id}`,
        group: 'Filter',
        label: `Show ${f.label}`,
        keywords: 'date filter',
        icon: CalendarRange,
        run: () => {
          if (!taskView) selectView({ kind: 'smart', id: 'inbox' })
          setDateFilter(f.id)
        },
      })),
      ...state.tags.map((t) => ({
        id: `tag-${t.id}`,
        group: 'Filter',
        label: `Tagged #${t.name}`,
        keywords: 'tag filter',
        icon: Hash,
        run: () => {
          setQuery('')
          setDateFilter(null)
          setView({ kind: 'smart', id: 'inbox' })
          setTagFilter([t.id])
          const inInbox = state.tasks.some((x) => x.listId === null && x.tags.includes(t.id))
          if (!inInbox) {
            const any = state.tasks.find((x) => x.tags.includes(t.id))
            if (any?.listId) setView({ kind: 'list', id: any.listId })
          }
        },
      })),
      ...state.tasks.map((t) => ({
        id: `task-${t.id}`,
        group: 'Tasks',
        label: t.title,
        keywords: t.notes.slice(0, 200),
        icon: t.done ? CircleCheckBig : ListTodo,
        hint: t.due ? shortLabel(t.due) : undefined,
        run: () => setOpenId(t.id),
      })),
    ]
    return list
  }, [state, sidebarOpen, taskView, isCompletedView, focusAdd, focusSearch, showSidebar, clearCompleted, selectView, setScene])

  // ---- Keyboard ----------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      const el = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || isOverlayOpen() || el.closest('input, textarea, [contenteditable="true"]')) return
      if (e.key === '/') {
        e.preventDefault()
        focusSearch()
      } else if (e.key === 'n') {
        e.preventDefault()
        focusAdd()
      } else if (e.key === '[') {
        showSidebar(!sidebarOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusAdd, focusSearch, showSidebar, sidebarOpen])

  const defaults = defaultsFor(view)
  const openTask = state.tasks.find((t) => t.id === openId) ?? null

  const sidebar = (
    <Sidebar
      view={view}
      onSelect={selectView}
      tasks={state.tasks}
      lists={state.lists}
      agencyName={state.prefs.agencyName}
      counts={{
        clients: state.clients.length,
        projects: state.projects.filter((p) => p.status !== 'archived' && p.status !== 'launched').length,
      }}
      query={query}
      onQuery={setQuery}
      searchRef={searchRef}
      onCollapse={() => showSidebar(false)}
      adding={addingList}
      onAdding={setAddingList}
      onAddList={(name) => {
        const l = actions.addList(name, state.lists.length)
        selectView({ kind: 'list', id: l.id })
      }}
      onUpdateList={actions.updateList}
      onRemoveList={actions.removeList}
      scene={state.prefs.scene}
      onScene={setScene}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenPalette={() => setPaletteOpen(true)}
    />
  )

  return (
    <MotionConfig reducedMotion="user">
      <DragProvider onDrop={onDrop}>
        <div className="relative h-dvh overflow-hidden">
          <Scenery scene={state.prefs.scene} photo={BACKGROUND_PHOTO} className="absolute inset-0" />

          <div className="relative flex h-full">
            {/* Sidebar: pushes the content on desktop, slides over it on phones. */}
            {narrow ? (
              <AnimatePresence>
                {mobileOpen && (
                  <>
                    <motion.div
                      key="scrim"
                      className="fixed inset-0 z-30 bg-[#0b1d24]/25"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setMobileOpen(false)}
                    />
                    <motion.aside
                      key="sheet"
                      aria-label="Sidebar"
                      className="fixed inset-y-0 left-0 z-40 overflow-hidden rounded-r-[18px] bg-white shadow-[var(--shadow-panel)]"
                      initial={{ x: -SIDEBAR_WIDTH - 20 }}
                      animate={{ x: 0 }}
                      exit={{ x: -SIDEBAR_WIDTH - 20 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                    >
                      {sidebar}
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>
            ) : (
              <motion.aside
                aria-label="Sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0, opacity: sidebarOpen ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 36, opacity: { duration: 0.2 } }}
                className="relative z-20 mt-[12px] shrink-0 overflow-hidden rounded-tr-[18px] bg-white shadow-[1px_0_0_rgb(16_24_40/0.04),8px_0_30px_-18px_rgb(16_24_40/0.35)]"
                aria-hidden={!sidebarOpen}
                inert={!sidebarOpen}
              >
                {sidebar}
              </motion.aside>
            )}

            <main data-drag-scroll className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
              <AnimatePresence>
                {!sidebarOpen && !narrow && (
                  <motion.div
                    className="absolute top-[14px] left-[14px] z-10"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <IconButton variant="glass" label="Show sidebar" onClick={() => showSidebar(true)} className="frost !size-9 !rounded-full">
                      <PanelLeftOpen size={18} strokeWidth={1.8} />
                    </IconButton>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`mx-auto w-full px-4 pt-[20px] md:pt-[30px] ${taskView ? 'max-w-[716px] pb-28' : 'max-w-[1080px] pb-24'}`}>
                <motion.header
                  key={`${current.title}-${view.kind}-${searching}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="flex h-[36px] items-center gap-[10px]"
                >
                  {narrow && (
                    <IconButton variant="glass" label="Show sidebar" onClick={() => setMobileOpen(true)} className="frost -ml-1 !size-10 !rounded-full">
                      <PanelLeftOpen size={18} strokeWidth={1.8} />
                    </IconButton>
                  )}
                  <IconChip icon={current.icon} tone={current.tone} size={32} filled={current.filled} />
                  <h1 className="text-photo min-w-0 truncate text-[30px] leading-none font-semibold tracking-[-0.01em]">{current.title}</h1>
                  {!taskView && !searching && (
                    <span className="text-photo ml-auto hidden shrink-0 text-[12.5px] font-semibold opacity-80 sm:block">
                      {state.prefs.agencyName}
                    </span>
                  )}
                </motion.header>

                {!taskView ? (
                  <motion.div
                    key="workspace"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.04 }}
                    className="mt-[18px]"
                  >
                    <Workspace
                      state={state}
                      actions={actions}
                      view={view}
                      onNavigate={selectView}
                      onOpenTask={setOpenId}
                      onToggleTask={toggle}
                    />
                  </motion.div>
                ) : isCompletedView ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.05 }} className="mt-[18px]">
                    <CompletedView
                      tasks={done}
                      lists={state.lists}
                      tags={state.tags}
                      clients={state.clients}
                      projects={state.projects}
                      members={state.members}
                      empty={SMART_LISTS.find((s) => s.id === 'completed')!.empty}
                      onToggle={toggle}
                      onStar={(t) => actions.updateTask(t.id, { starred: !t.starred })}
                      onDue={(t, due) => actions.updateTask(t.id, { due })}
                      onOpen={(t) => setOpenId(t.id)}
                      onClearAll={clearCompleted}
                    />
                  </motion.div>
                ) : (
                  <>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.05 }} className="mt-[18px]">
                      <AddTaskBar
                        inputRef={addRef}
                        defaultDue={defaults.due ?? null}
                        defaultStarred={defaults.starred ?? false}
                        onAdd={(raw, due, starred) => {
                          const parsed = parseQuickAdd(raw)
                          const title = parsed.title || raw
                          const tagIds = parsed.tags.map((name, i) => {
                            const found = state.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
                            return found ? found.id : actions.addTag(name, state.tags.length + i).id
                          })
                          const listId = view.kind === 'list' && !searching ? view.id : null
                          actions.addTask(title, { due, starred, listId, tags: tagIds, priority: parsed.priority ?? 0 })
                          if (searching) setQuery('')
                        }}
                      />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.1 }} className="mt-[13px]">
                      <SegmentedControl
                        label="Filter by date"
                        options={DATE_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
                        value={dateFilter}
                        onChange={setDateFilter}
                      />
                      <AnimatePresence initial={false}>
                        {viewTags.length > 0 && <TagFilter key="tags" tags={viewTags} selected={tagFilter} onChange={setTagFilter} />}
                      </AnimatePresence>
                    </motion.div>

                    <div className="mt-[8px]">
                      <TaskView
                        open={open}
                        done={done}
                        completing={completing}
                        lists={state.lists}
                        tags={state.tags}
                        clients={state.clients}
                        projects={state.projects}
                        members={state.members}
                        showList={searching || view.kind === 'smart'}
                        empty={empty}
                        onToggle={toggle}
                        onStar={(t) => actions.updateTask(t.id, { starred: !t.starred })}
                        onDue={(t, due) => actions.updateTask(t.id, { due })}
                        onOpen={(t) => setOpenId(t.id)}
                        onMove={onMove}
                      />
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>

          <TaskDrawer
            task={openTask}
            lists={state.lists}
            tags={state.tags}
            projects={state.projects}
            members={state.members}
            time={state.time}
            onClose={() => setOpenId(null)}
            onUpdate={actions.updateTask}
            onToggle={(id) => {
              const t = state.tasks.find((x) => x.id === id)
              if (!t) return
              if (t.done) actions.toggleTask(id)
              else finishToggle(t)
            }}
            onRemove={(id) => {
              const t = state.tasks.find((x) => x.id === id)
              setOpenId(null)
              actions.removeTask(id)
              if (t)
                notify(
                  <>
                    Deleted <span className="font-semibold">{t.title}</span>
                  </>,
                  { label: 'Undo', run: () => actions.restoreTasks([t]) },
                )
            }}
            onCreateTag={(name) => actions.addTag(name, state.tags.length)}
            onLogTime={(minutes, note) => {
              if (!openTask) return
              const t = state.tasks.find((x) => x.id === openTask.id)
              if (!t) return
              actions.logTime({
                taskId: t.id,
                projectId: t.projectId,
                memberId: t.assigneeId,
                date: new Date().toISOString().slice(0, 10),
                minutes,
                note,
                billable: t.billable,
              })
              notify(`Logged ${minutes >= 60 ? `${Math.round((minutes / 60) * 10) / 10}h` : `${minutes}m`} to ${t.title}`)
            }}
            onRemoveTime={actions.removeTime}
          />

          <SettingsSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            state={state}
            actions={actions}
            onScene={setScene}
            onNotice={(message, undo) => notify(message, undo ? { label: 'Undo', run: undo } : undefined)}
          />

          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      </DragProvider>
    </MotionConfig>
  )
}

