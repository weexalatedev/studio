// Dates are stored as local calendar days, `YYYY-MM-DD`, so a task due
// "today" stays due today whatever the time zone of the browser.

export type DateBucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none'

export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + days)
  return toKey(d)
}

/** Whole days from today to `key` (negative when in the past). */
export function daysFromToday(key: string): number {
  const a = fromKey(todayKey()).getTime()
  const b = fromKey(key).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function bucketOf(due: string | null): DateBucket {
  if (!due) return 'none'
  const n = daysFromToday(due)
  if (n < 0) return 'overdue'
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n <= 7) return 'week'
  return 'later'
}

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const monthDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const full = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

/** "Today", "Tomorrow", "Fri", "Mar 4", "Yesterday". */
export function shortLabel(key: string): string {
  const n = daysFromToday(key)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1 && n < 7) return weekday.format(fromKey(key))
  return monthDay.format(fromKey(key))
}

export function longLabel(key: string): string {
  return full.format(fromKey(key))
}

/** The 6×7 grid of days shown for `month` (any day inside it), Monday first. */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export type RepeatUnit = 'day' | 'week' | 'month'

/** `key` moved forward by `every` days, weeks or months (months clamp to the last day). */
export function addInterval(key: string, every: number, unit: RepeatUnit): string {
  if (unit === 'day') return addDays(key, every)
  if (unit === 'week') return addDays(key, every * 7)
  const d = fromKey(key)
  const day = d.getDate()
  const target = new Date(d.getFullYear(), d.getMonth() + every, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, last))
  return toKey(target)
}

/** "Today", "Yesterday", "Monday, March 4" for a timestamp: completed-group headings. */
export function dayHeading(ts: number): string {
  const key = toKey(new Date(ts))
  const n = daysFromToday(key)
  if (n === 0) return 'Today'
  if (n === -1) return 'Yesterday'
  return longLabel(key)
}
