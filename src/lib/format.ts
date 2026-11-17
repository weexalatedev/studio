// Display helpers: money, hours and dates for the studio screens.

import type { Currency } from '../data'
import { addDays, daysFromToday, todayKey } from './dates'

export function money(value: number, currency: Currency = 'USD', compact = false): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      notation: compact && Math.abs(value) >= 10_000 ? 'compact' : 'standard',
    }).format(value)
  } catch {
    return `${Math.round(value)}`
  }
}

/** 150 → "2.5h", 120 → "2h", 0 → "0h". */
export function hoursLabel(minutes: number): string {
  const h = minutes / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`
}

/** A percentage clamped to 0–100 for progress bars. */
export const pct = (part: number, whole: number) => (whole <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((part / whole) * 100))))

/** Monday of the current week. */
export function weekStart(): string {
  const today = todayKey()
  const dow = (new Date().getDay() + 6) % 7
  return addDays(today, -dow)
}

/** The seven keys of the current week, Monday first. */
export function weekDays(): string[] {
  const start = weekStart()
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const dayMonth = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

/** "Mon" for a key in this week, "Mon 4" otherwise. */
export function weekdayLabel(key: string): string {
  const d = new Date(`${key}T00:00:00`)
  return dayName.format(d)
}

export function dateLabel(key: string): string {
  return dayMonth.format(new Date(`${key}T00:00:00`))
}

/** "in 3 days", "today", "2 days ago". */
export function relativeDue(key: string | null): string {
  if (!key) return 'No date'
  const n = daysFromToday(key)
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n === -1) return '1 day overdue'
  if (n < 0) return `${Math.abs(n)} days overdue`
  return `Due in ${n} days`
}
