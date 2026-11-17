import { Check, Plus } from 'lucide-react'
import { useState } from 'react'

import { MenuItem, MenuLabel, MenuSeparator } from '../components/Menu'
import { TextInput } from '../components/TextField'
import { toneSolid } from '../components/tones'
import type { Tag } from './store'

type Props = {
  tags: Tag[]
  selected: string[]
  onToggle: (id: string) => void
  /** Create a tag by name and select it. */
  onCreate: (name: string) => void
}

/** Pick tags for a task; type to filter, Enter creates a new tag. */
export function TagPicker({ tags, selected, onToggle, onCreate }: Props) {
  const [q, setQ] = useState('')
  const name = q.trim().replace(/^#/, '')
  const shown = tags.filter((t) => t.name.toLowerCase().includes(name.toLowerCase()))
  const exact = tags.some((t) => t.name.toLowerCase() === name.toLowerCase())

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name) return
          const match = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
          if (match) onToggle(match.id)
          else onCreate(name)
          setQ('')
        }}
      >
        <TextInput size="sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find or create a tag" aria-label="Find or create a tag" maxLength={24} data-autofocus />
      </form>
      <div className="mt-1.5 max-h-[220px] overflow-y-auto">
        {shown.length === 0 && !name && <MenuLabel>No tags yet. Type a name and press Enter.</MenuLabel>}
        {shown.map((t) => {
          const on = selected.includes(t.id)
          return (
            <MenuItem
              key={t.id}
              aria-pressed={on}
              leading={<span className="size-2.5 shrink-0 rounded-full" style={{ background: toneSolid(t.tone) }} />}
              label={t.name}
              trailing={on ? <Check size={15} className="text-inbox-ink" /> : undefined}
              onClick={() => onToggle(t.id)}
            />
          )
        })}
        {name && !exact && (
          <>
            {shown.length > 0 && <MenuSeparator />}
            <MenuItem icon={Plus} label={`Create “${name}”`} onClick={() => (onCreate(name), setQ(''))} />
          </>
        )}
      </div>
    </div>
  )
}
