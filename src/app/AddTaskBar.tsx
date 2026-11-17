import { CalendarDays, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type RefObject } from 'react'

import { DatePicker } from '../components/DatePicker'
import { IconButton } from '../components/IconButton'
import { Popover } from '../components/Popover'
import { StarButton } from '../components/StarButton'
import { COPY } from '../data'
import { shortLabel } from '../lib/dates'

type Props = {
  inputRef: RefObject<HTMLInputElement | null>
  /** Date and star the current view would give a new task. */
  defaultDue: string | null
  defaultStarred: boolean
  onAdd: (title: string, due: string | null, starred: boolean) => void
}

/**
 * The frosted "Add a task…" pill. Enter adds; the calendar and star preset the
 * new task; `#tag` and `!high` inside the text are parsed by the caller.
 */
export function AddTaskBar({ inputRef, defaultDue, defaultStarred, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState<string | null | undefined>(undefined)
  const [starred, setStarred] = useState<boolean | undefined>(undefined)
  const [picking, setPicking] = useState(false)
  const calRef = useRef<HTMLButtonElement>(null)

  const effectiveDue = due === undefined ? defaultDue : due
  const effectiveStar = starred ?? defaultStarred

  const submit = () => {
    const t = title.trim()
    if (!t) return
    onAdd(t, effectiveDue, effectiveStar)
    setTitle('')
    setDue(undefined)
    setStarred(undefined)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="frost group/add flex h-[45px] items-center gap-2 rounded-full pr-[8px] pl-[14px] transition-[background-color,box-shadow] duration-200 focus-within:bg-white/85 has-[input:focus-visible]:shadow-[0_0_0_2px_var(--color-inbox)]"
    >
      <button
        type="submit"
        aria-label="Add task"
        className="hit-40 grid size-6 shrink-0 place-items-center rounded-full text-ink-2 transition-[transform,color] duration-150 hover:text-inbox active:scale-85"
      >
        <Plus size={19} strokeWidth={1.9} />
      </button>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={COPY.addPlaceholder}
        aria-label="New task title"
        aria-description="Type #tag to tag it and !high, !med or !low to set a priority"
        maxLength={200}
        className="h-full min-w-0 flex-1 bg-transparent pl-1 text-[16px] text-ink outline-none placeholder:text-[#8f949b]"
      />
      <AnimatePresence initial={false}>
        {effectiveDue && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/80 pr-1 pl-2.5 text-[12.5px] font-semibold text-inbox-ink"
          >
            {shortLabel(effectiveDue)}
            <button
              type="button"
              aria-label="Clear date"
              onClick={() => setDue(null)}
              className="grid size-5 place-items-center rounded-full text-muted hover:bg-hover hover:text-ink"
            >
              <X size={12} strokeWidth={2.6} />
            </button>
          </motion.span>
        )}
      </AnimatePresence>
      <IconButton
        ref={calRef}
        variant="glass"
        label="Set due date"
        active={picking}
        onClick={() => setPicking((p) => !p)}
      >
        <CalendarDays size={19} strokeWidth={1.7} />
      </IconButton>
      <StarButton starred={effectiveStar} onToggle={() => setStarred(!effectiveStar)} size={19} idleTone="text-ink-2/80" className="!size-8 rounded-[10px]" />
      <Popover open={picking} onClose={() => setPicking(false)} anchorRef={calRef} label="Due date for the new task">
        <DatePicker
          value={effectiveDue}
          onChange={(v) => {
            setDue(v)
            setPicking(false)
            inputRef.current?.focus()
          }}
        />
      </Popover>
    </form>
  )
}
