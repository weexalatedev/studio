import { CalendarDays } from 'lucide-react'

import { daysFromToday, shortLabel } from '../lib/dates'

/** Small date label on a task row; red when overdue, orange when due today. */
export function DueBadge({ due, done }: { due: string; done?: boolean }) {
  const n = daysFromToday(due)
  const tone = done
    ? 'text-muted'
    : n < 0
      ? 'text-danger-ink'
      : n === 0
        ? 'text-today-ink'
        : n === 1
          ? 'text-upcoming-ink'
          : 'text-muted'
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold ${tone}`}>
      <CalendarDays size={13} strokeWidth={2.2} />
      {shortLabel(due)}
    </span>
  )
}
