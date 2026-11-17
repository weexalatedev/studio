import { Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Checkbox } from '../components/Checkbox'
import { IconButton } from '../components/IconButton'
import { ProgressRing } from '../components/ProgressRing'
import { COPY } from '../data'
import { uid, type Subtask } from './store'

/** Checklist inside the task drawer: tick, rename inline, remove, add. */
export function Subtasks({ items, onChange }: { items: Subtask[]; onChange: (items: Subtask[]) => void }) {
  const [draft, setDraft] = useState('')
  const done = items.filter((s) => s.done).length

  const add = () => {
    const title = draft.trim()
    if (!title) return
    onChange([...items, { id: uid(), title, done: false }])
    setDraft('')
  }

  return (
    <section aria-label="Subtasks" className="mt-5 rounded-[16px] border border-line">
      <header className="flex h-[44px] items-center justify-between pr-3 pl-4">
        <h3 className="text-[14px] text-muted">Subtasks</h3>
        {items.length > 0 && <ProgressRing done={done} total={items.length} />}
      </header>
      <ul>
        <AnimatePresence initial={false}>
          {items.map((s) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="group/sub flex min-h-[40px] items-center gap-3 border-t border-line pr-2 pl-4"
            >
              <Checkbox
                size={18}
                checked={s.done}
                label={s.done ? `Mark “${s.title}” as not done` : `Mark “${s.title}” as done`}
                onChange={() => onChange(items.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
              />
              <input
                value={s.title}
                aria-label="Subtask"
                maxLength={200}
                onChange={(e) => onChange(items.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                onBlur={(e) => {
                  if (!e.target.value.trim()) onChange(items.filter((x) => x.id !== s.id))
                }}
                className={`min-w-0 flex-1 bg-transparent py-2 text-[14.5px] outline-none ${s.done ? 'text-muted line-through' : 'text-ink'}`}
              />
              <IconButton
                size="sm"
                label={`Remove subtask “${s.title}”`}
                onClick={() => onChange(items.filter((x) => x.id !== s.id))}
                className="opacity-60 group-hover/sub:opacity-100 focus-visible:opacity-100"
              >
                <X size={14} />
              </IconButton>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
        className="flex min-h-[44px] items-center gap-3 border-t border-line pr-2 pl-4"
      >
        <Plus size={18} className="shrink-0 text-muted" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={COPY.subtaskPlaceholder}
          aria-label="New subtask"
          maxLength={200}
          className="min-w-0 flex-1 bg-transparent py-2 text-[14.5px] text-ink outline-none"
        />
        {draft.trim() && (
          <button type="submit" className="rounded-[8px] px-2 py-1 text-[13px] font-semibold text-inbox-ink hover:bg-inbox/10">
            Add
          </button>
        )}
      </form>
    </section>
  )
}
