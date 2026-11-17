import { CornerDownLeft, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

import { Kbd } from '../components/Kbd'
import { Modal } from '../components/Modal'
import { COPY } from '../data'

export type Command = {
  id: string
  group: string
  label: string
  /** Extra words that should match ("dark" for Night). */
  keywords?: string
  icon?: LucideIcon
  /** Custom leading element (an icon chip). */
  leading?: ReactNode
  hint?: ReactNode
  run: () => void
}

type Props = {
  open: boolean
  onClose: () => void
  commands: Command[]
}

const MAX_PER_GROUP = 8

/**
 * ⌘K / Ctrl+K: type to filter actions, lists and tasks. ↑↓ move, Enter runs,
 * Escape closes. The input is a combobox driving a listbox (active-descendant).
 */
export function CommandPalette({ open, onClose, commands }: Props) {
  return (
    <Modal open={open} onClose={onClose} label="Command palette" placement="top" width={600}>
      {open && <PaletteBody commands={commands} onClose={onClose} />}
    </Modal>
  )
}

function PaletteBody({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const base = useId().replace(/:/g, '')

  const groups = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const hits = commands.filter((c) => {
      const hay = `${c.group} ${c.label} ${c.keywords ?? ''}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
    const by = new Map<string, Command[]>()
    for (const c of hits) {
      const g = by.get(c.group) ?? []
      // Tasks only show up once you type, so the default list stays short.
      if (c.group === 'Tasks' && !words.length) continue
      if (g.length < MAX_PER_GROUP) by.set(c.group, [...g, c])
    }
    return [...by.entries()]
  }, [q, commands])

  const flat = groups.flatMap(([, items]) => items)
  const current = flat[Math.min(active, flat.length - 1)]

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    if (!current) return
    document.getElementById(`${base}-${current.id}`)?.scrollIntoView({ block: 'nearest' })
  }, [current, base])

  const run = (c: Command | undefined) => {
    if (!c) return
    onClose()
    // Let the modal unmount (and restore focus) before the command moves focus elsewhere.
    requestAnimationFrame(() => c.run())
  }

  return (
    <>
      <div className="flex h-[58px] shrink-0 items-center gap-3 border-b border-line px-5">
        <Search size={19} className="shrink-0 text-muted" aria-hidden />
        <input
          data-autofocus
          role="combobox"
          aria-expanded="true"
          aria-controls={`${base}-list`}
          aria-activedescendant={current ? `${base}-${current.id}` : undefined}
          aria-autocomplete="list"
          aria-label="Command"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => (flat.length ? (a + 1) % flat.length : 0))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              run(current)
            }
          }}
          placeholder={COPY.palettePlaceholderText}
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>

      <div ref={listRef} id={`${base}-list`} role="listbox" aria-label="Commands" className="min-h-0 flex-1 overflow-y-auto p-2">
        {flat.length === 0 && (
          <p className="px-3 py-8 text-center text-[14.5px] text-muted" role="presentation">
            No matches for “{q.trim()}”.
          </p>
        )}
        {groups.map(([group, items]) => (
          <div key={group} role="group" aria-labelledby={`${base}-g-${group}`}>
            <p id={`${base}-g-${group}`} className="px-3 pt-2.5 pb-1 text-[12px] font-semibold text-muted">
              {group}
            </p>
            {items.map((c) => {
              const on = c === current
              const Icon = c.icon
              return (
                <div
                  key={c.id}
                  id={`${base}-${c.id}`}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => setActive(flat.indexOf(c))}
                  onClick={() => run(c)}
                  className={`flex h-11 cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[15px] transition-colors duration-100 ${
                    on ? 'bg-active text-ink' : 'text-ink-2'
                  }`}
                >
                  {c.leading ?? (Icon && <Icon size={18} strokeWidth={1.9} className="shrink-0 text-muted" aria-hidden />)}
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="shrink-0 text-[12.5px] text-muted">{c.hint}</span>}
                  {on && <CornerDownLeft size={15} className="shrink-0 text-muted" aria-hidden />}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="hidden h-[42px] shrink-0 items-center gap-4 border-t border-line px-5 text-[12.5px] text-muted sm:flex">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> to move
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↵</Kbd> to run
        </span>
        <span className="ml-auto">{COPY.quickAddHint}</span>
      </div>
    </>
  )
}
