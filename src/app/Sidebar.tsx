import {
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CircleCheckBig,
  Clock3,
  Command,
  FolderKanban,
  Image,
  Inbox,
  LayoutDashboard,
  Sparkles,
  Users,
  MoreHorizontal,
  PanelLeftClose,
  Palette,
  Pencil,
  Plus,
  Settings,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type ReactNode, type RefObject } from 'react'

import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { IconChip } from '../components/IconChip'
import { MenuItem, MenuSeparator } from '../components/Menu'
import { Popover } from '../components/Popover'
import { SearchField } from '../components/SearchField'
import { COPY, SMART_LISTS, type SceneId, type SmartListId, type Tone } from '../data'
import { Link } from '../router'
import { ListAppearance } from './ListAppearance'
import { ScenePicker } from './ScenePicker'
import { useDrag, viewKey } from './dnd'
import { LIST_ICONS } from './listIcons'
import { countOpen, type Task, type TaskList, type View } from './store'

export const SIDEBAR_WIDTH = 224

export const SMART_ICONS: Record<SmartListId, LucideIcon> = {
  inbox: Inbox,
  today: CalendarDays,
  upcoming: CalendarClock,
  starred: Star,
  completed: CircleCheckBig,
}

type Props = {
  view: View
  onSelect: (view: View) => void
  tasks: Task[]
  lists: TaskList[]
  agencyName: string
  counts: { clients: number; projects: number }
  query: string
  onQuery: (q: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  onCollapse: () => void
  /** The inline "new list" field is open (lifted so the command palette can open it). */
  adding: boolean
  onAdding: (adding: boolean) => void
  onAddList: (name: string) => void
  onUpdateList: (id: string, patch: Partial<TaskList>) => void
  onRemoveList: (id: string) => void
  scene: SceneId
  onScene: (scene: SceneId) => void
  onOpenSettings: () => void
  onOpenPalette: () => void
}

export function Sidebar(props: Props) {
  const { view, onSelect, tasks, lists, query, onQuery, searchRef, onCollapse, agencyName, counts } = props
  const { adding, onAdding: setAdding } = props

  return (
    <div className="flex h-full flex-col" style={{ width: SIDEBAR_WIDTH }}>
      <div className="flex h-[52px] shrink-0 items-center gap-2 pr-[10px] pl-[14px]">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-[9px] text-white"
          style={{ background: 'linear-gradient(180deg, var(--color-inbox-2), var(--color-inbox))', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.35)' }}
        >
          <Sparkles size={15} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{agencyName}</span>
        <IconButton label="Collapse sidebar" onClick={onCollapse}>
          <PanelLeftClose size={18} strokeWidth={1.8} />
        </IconButton>
      </div>

      <div className="px-[10px] pt-[6px]">
        <SearchField ref={searchRef} value={query} onChange={onQuery} placeholder={COPY.searchPlaceholder} />
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-[6px] pb-6" aria-label="Lists">
        <h2 className="px-[13px] pt-[24px] pb-[9px] text-[14px] text-muted">Studio</h2>
        <ul className="flex flex-col gap-px">
          <li>
            <NavItem
              view={{ kind: 'overview' }}
              icon={LayoutDashboard}
              tone="inbox"
              label="Overview"
              count={0}
              active={view.kind === 'overview'}
              onClick={() => onSelect({ kind: 'overview' })}
            />
          </li>
          <li>
            <NavItem
              view={{ kind: 'clients' }}
              icon={Building2}
              tone="teal"
              label="Clients"
              count={counts.clients}
              active={view.kind === 'clients' || view.kind === 'client'}
              onClick={() => onSelect({ kind: 'clients' })}
            />
          </li>
          <li>
            <NavItem
              view={{ kind: 'projects' }}
              icon={FolderKanban}
              tone="upcoming"
              label="Projects"
              count={counts.projects}
              active={view.kind === 'projects' || view.kind === 'project'}
              onClick={() => onSelect({ kind: 'projects' })}
            />
          </li>
          <li>
            <NavItem
              view={{ kind: 'team' }}
              icon={Users}
              tone="rose"
              label="Team"
              count={0}
              active={view.kind === 'team'}
              onClick={() => onSelect({ kind: 'team' })}
            />
          </li>
          <li>
            <NavItem
              view={{ kind: 'time' }}
              icon={Clock3}
              tone="green"
              label="Timesheet"
              count={0}
              active={view.kind === 'time'}
              onClick={() => onSelect({ kind: 'time' })}
            />
          </li>
        </ul>

        <div className="mx-[13px] mt-[12px] h-px bg-line" />

        <h2 className="px-[13px] pt-[18px] pb-[9px] text-[14px] text-muted">{COPY.smartListsHeading}</h2>
        <ul className="flex flex-col gap-px">
          {SMART_LISTS.map((s) => {
            const v: View = { kind: 'smart', id: s.id }
            return (
              <li key={s.id}>
              <NavItem
                view={v}
                icon={SMART_ICONS[s.id]}
                tone={s.tone}
                filled={s.id === 'starred'}
                label={s.name}
                count={countOpen(tasks, v)}
                active={!query && view.kind === 'smart' && view.id === s.id}
                onClick={() => onSelect(v)}
              />
              </li>
            )
          })}
        </ul>

        <div className="mx-[13px] mt-[12px] h-px bg-line" />

        <div className="flex items-center justify-between pr-[6px] pl-[13px] pt-[10px] pb-[6px]">
          <h2 className="text-[14px] font-normal text-muted">{COPY.listsHeading}</h2>
          <IconButton size="sm" label="New list" onClick={() => setAdding(true)}>
            <Plus size={18} strokeWidth={1.8} />
          </IconButton>
        </div>

        <ul className="flex flex-col gap-px">
          <AnimatePresence initial={false}>
            {lists.map((l) => {
              const v: View = { kind: 'list', id: l.id }
              return (
                <motion.li
                  key={l.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <UserListItem
                    list={l}
                    count={countOpen(tasks, v)}
                    active={!query && view.kind === 'list' && view.id === l.id}
                    onClick={() => onSelect(v)}
                    onUpdate={(patch) => props.onUpdateList(l.id, patch)}
                    onRemove={() => props.onRemoveList(l.id)}
                  />
                </motion.li>
              )
            })}
          </AnimatePresence>
          {adding && (
            <li>
              <NameInput
                tone={NEW_TONE}
                onSubmit={(name) => {
                  props.onAddList(name)
                  setAdding(false)
                }}
                onCancel={() => setAdding(false)}
              />
            </li>
          )}
        </ul>

        {lists.length === 0 && !adding && (
          <p className="px-[13px] pt-[14px] text-[14px] leading-[1.5] text-muted">{COPY.listsEmpty}</p>
        )}
      </nav>

      <SidebarFooter scene={props.scene} onScene={props.onScene} onOpenSettings={props.onOpenSettings} onOpenPalette={props.onOpenPalette} />
    </div>
  )
}

function SidebarFooter({
  scene,
  onScene,
  onOpenSettings,
  onOpenPalette,
}: {
  scene: SceneId
  onScene: (s: SceneId) => void
  onOpenSettings: () => void
  onOpenPalette: () => void
}) {
  const [picking, setPicking] = useState(false)
  const sceneRef = useRef<HTMLButtonElement>(null)
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <footer className="flex h-[52px] shrink-0 items-center gap-0.5 border-t border-line px-[10px]">
      <IconButton label="Settings" onClick={onOpenSettings}>
        <Settings size={18} strokeWidth={1.8} />
      </IconButton>
      <IconButton ref={sceneRef} label="Change background" active={picking} onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
        <Image size={18} strokeWidth={1.8} />
      </IconButton>
      <Popover open={picking} onClose={() => setPicking(false)} anchorRef={sceneRef} align="start" width={300} label="Background">
        <p className="px-1 pb-2 text-[12px] font-semibold text-muted">Background</p>
        <ScenePicker value={scene} onChange={onScene} />
      </Popover>
      <IconButton label={`Command palette (${mac ? '⌘' : 'Ctrl+'}K)`} onClick={onOpenPalette}>
        <Command size={17} strokeWidth={1.8} />
      </IconButton>
      <Link
        to="/styleguide"
        aria-label="Style guide"
        title="Style guide"
        className="hit-40 ml-auto grid size-8 place-items-center rounded-[10px] text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-inbox"
      >
        <Palette size={18} strokeWidth={1.8} aria-hidden />
      </Link>
    </footer>
  )
}

const NEW_TONE: Tone = 'slate'

type NavItemProps = {
  /** The view this entry opens; also what a dragged task is dropped onto. */
  view: View
  icon: LucideIcon
  tone: Tone
  filled?: boolean
  label: string
  count: number
  active: boolean
  onClick: () => void
  trailing?: ReactNode
}

function NavItem({ view, icon, tone, filled, label, count, active, onClick, trailing }: NavItemProps) {
  const { drag } = useDrag()
  const over = drag?.target?.kind === 'view' && viewKey(drag.target.view) === viewKey(view)
  return (
      <div
        data-drop-view={viewKey(view)}
        className={`group relative flex h-[45px] items-center rounded-[var(--radius-item)] transition-[background-color,box-shadow,transform] duration-150 ${
          over ? 'scale-[1.02] bg-inbox/10 shadow-[inset_0_0_0_2px_var(--color-inbox)]' : active ? 'bg-active' : drag ? '' : 'hover:bg-hover'
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          aria-current={active ? 'page' : undefined}
          className="flex h-full min-w-0 flex-1 items-center gap-[12px] rounded-[var(--radius-item)] pr-[14px] pl-[13px] text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox"
        >
          <motion.span animate={{ scale: over ? 1.15 : 1 }} className="grid transition-transform duration-150 group-active:scale-[0.88]">
            <IconChip icon={icon} tone={tone} size={28} filled={filled} />
          </motion.span>
          <span className="min-w-0 flex-1 truncate text-[16px] text-ink">{label}</span>
          <AnimatePresence mode="popLayout" initial={false}>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.16 }}
                className={`text-[14px] tabular-nums text-muted ${trailing ? 'transition-opacity group-hover:opacity-0 group-focus-within:opacity-0' : ''}`}
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        {trailing}
      </div>
  )
}

function UserListItem({
  list,
  count,
  active,
  onClick,
  onUpdate,
  onRemove,
}: {
  list: TaskList
  count: number
  active: boolean
  onClick: () => void
  onUpdate: (patch: Partial<TaskList>) => void
  onRemove: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [menu, setMenu] = useState<'closed' | 'menu' | 'style' | 'confirm'>('closed')
  const moreRef = useRef<HTMLButtonElement>(null)
  const icon = LIST_ICONS[list.icon].icon

  if (renaming) {
    return (
      <NameInput
        tone={list.tone}
        icon={icon}
        initial={list.name}
        onSubmit={(name) => {
          onUpdate({ name })
          setRenaming(false)
        }}
        onCancel={() => setRenaming(false)}
      />
    )
  }

  return (
    <div onDoubleClick={() => setRenaming(true)}>
      <NavItem
        view={{ kind: 'list', id: list.id }}
        icon={icon}
        tone={list.tone}
        label={list.name}
        count={count}
        active={active}
        onClick={onClick}
        trailing={
          <>
            <IconButton
              ref={moreRef}
              size="sm"
              label={`${list.name} options`}
              aria-expanded={menu !== 'closed'}
              onClick={() => setMenu((m) => (m === 'closed' ? 'menu' : 'closed'))}
              className={`absolute right-[8px] transition-opacity ${menu !== 'closed' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100'}`}
            >
              <MoreHorizontal size={16} />
            </IconButton>
            <Popover open={menu !== 'closed'} onClose={() => setMenu('closed')} anchorRef={moreRef} align="start" width={menu === 'style' ? 268 : 220} label={`${list.name} options`}>
              {menu === 'menu' ? (
                <div className="flex flex-col">
                  <MenuItem
                    icon={Pencil}
                    label="Rename"
                    onClick={() => {
                      setMenu('closed')
                      setRenaming(true)
                    }}
                  />
                  <MenuItem icon={Palette} label="Icon & colour" onClick={() => setMenu('style')} />
                  <MenuSeparator />
                  <MenuItem icon={Trash2} label="Delete list" danger onClick={() => setMenu('confirm')} />
                </div>
              ) : menu === 'style' ? (
                <ListAppearance tone={list.tone} icon={list.icon} onChange={onUpdate} />
              ) : (
                <div className="p-1.5">
                  <p className="text-[14px] font-semibold text-ink">Delete “{list.name}”?</p>
                  <p className="mt-1 text-[13px] leading-snug text-muted">{COPY.deleteListConfirm}</p>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setMenu('closed')}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-autofocus
                      onClick={() => {
                        setMenu('closed')
                        onRemove()
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Popover>
          </>
        }
      />
    </div>
  )
}

/** Inline name field used to create and rename lists. */
function NameInput({
  tone,
  icon = LIST_ICONS.list.icon,
  initial = '',
  onSubmit,
  onCancel,
}: {
  tone: Tone
  icon?: LucideIcon
  initial?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  const submit = () => {
    const name = value.trim()
    if (name) onSubmit(name)
    else onCancel()
  }
  return (
    <motion.form
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex h-[45px] items-center gap-[12px] rounded-[var(--radius-item)] bg-hover pr-[8px] pl-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--color-inbox)]"
    >
      <IconChip icon={icon} tone={tone} size={28} />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        placeholder={COPY.newListPlaceholder}
        aria-label="List name"
        maxLength={40}
        className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none"
      />
      <IconButton size="sm" label="Save list" type="submit" onMouseDown={(e) => e.preventDefault()}>
        <Check size={16} />
      </IconButton>
    </motion.form>
  )
}
