import { Tags, X } from 'lucide-react'
import { motion } from 'motion/react'

import { TagChip } from '../components/TagChip'
import { EASE_OUT } from '../lib/motion'
import type { Tag } from './store'

type Props = {
  /** Tags used by tasks in the current view. */
  tags: Tag[]
  selected: string[]
  onChange: (ids: string[]) => void
}

/** A frosted strip of tag chips; selecting chips shows tasks with any of them. */
export function TagFilter({ tags, selected, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <div role="group" aria-label="Filter by tag" className="scrollbar-none mt-[8px] flex items-center gap-1.5 overflow-x-auto rounded-full frost py-[5px] pr-[5px] pl-3">
        <Tags size={15} className="shrink-0 text-ink-2" aria-hidden />
        {tags.map((t) => {
          const on = selected.includes(t.id)
          return (
            <TagChip
              key={t.id}
              name={t.name}
              tone={t.tone}
              size="md"
              selected={on}
              onClick={() => onChange(on ? selected.filter((x) => x !== t.id) : [...selected, t.id])}
            />
          )
        })}
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-inbox"
          >
            <X size={13} strokeWidth={2.6} /> Clear
          </button>
        )}
      </div>
    </motion.div>
  )
}
