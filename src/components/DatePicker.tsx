import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Sofa, Sun, Sunrise } from 'lucide-react'
import { useState } from 'react'

import { addDays, fromKey, longLabel, monthGrid, shortLabel, toKey, todayKey } from '../lib/dates'
import { IconButton } from './IconButton'
import { MenuItem, MenuSeparator } from './Menu'

type Props = {
  value: string | null
  onChange: (value: string | null) => void
}

const monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function nextWeekend(from: string): string {
  const d = fromKey(from)
  const add = (6 - d.getDay() + 7) % 7 || 7
  return addDays(from, add)
}

/** Quick picks plus a month grid. Used in the add bar and the task drawer. */
export function DatePicker({ value, onChange }: Props) {
  const today = todayKey()
  const [month, setMonth] = useState(() => fromKey(value ?? today))
  const days = monthGrid(month)

  const presets = [
    { label: 'Today', icon: Sun, value: today, tint: 'text-today' },
    { label: 'Tomorrow', icon: Sunrise, value: addDays(today, 1), tint: 'text-upcoming' },
    { label: 'This weekend', icon: Sofa, value: nextWeekend(today), tint: 'text-inbox' },
    { label: 'Next week', icon: CalendarDays, value: addDays(today, 7), tint: 'text-success' },
  ]

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <div className="text-ink">
      <ul className="flex flex-col">
        {presets.map((p) => (
          <li key={p.label}>
            <MenuItem
              icon={p.icon}
              iconClass={p.tint}
              label={p.label}
              trailing={shortLabel(p.value)}
              selected={value === p.value}
              onClick={() => onChange(p.value)}
            />
          </li>
        ))}
        {value && (
          <li>
            <MenuItem icon={CalendarX2} label="No date" danger onClick={() => onChange(null)} />
          </li>
        )}
      </ul>
      <MenuSeparator />

      <div className="px-1 pb-1">
        <div className="mb-1 flex items-center justify-between pl-1.5">
          <span className="text-[13px] font-semibold">{monthName.format(month)}</span>
          <div className="flex">
            <IconButton size="sm" label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft size={16} />
            </IconButton>
            <IconButton size="sm" label="Next month" onClick={() => shift(1)}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((d) => {
            const key = toKey(d)
            const inMonth = d.getMonth() === month.getMonth()
            const selected = key === value
            const isToday = key === today
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                aria-label={longLabel(key)}
                aria-pressed={selected}
                className={`mx-auto grid size-8 place-items-center rounded-full text-[13px] tabular-nums transition-[background-color,color,transform] duration-150 active:scale-90 ${
                  selected
                    ? 'bg-inbox-ink font-semibold text-white'
                    : isToday
                      ? 'font-bold text-inbox-ink hover:bg-inbox/10'
                      : inMonth
                        ? 'text-ink-2 hover:bg-hover'
                        : 'text-muted hover:bg-hover'
                }`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
