import { Flag } from 'lucide-react'

import { PRIORITIES, type Priority } from '../data'

export const PRIORITY_COLOR: Record<Priority, string> = {
  0: 'var(--color-faint)',
  1: 'var(--color-inbox)',
  2: 'var(--color-today)',
  3: 'var(--color-danger)',
}

/** A small filled flag: blue low, orange medium, red high. Renders nothing for "none" unless `showNone`. */
export function PriorityFlag({ priority, size = 15, showNone = false }: { priority: Priority; size?: number; showNone?: boolean }) {
  if (priority === 0 && !showNone) return null
  const color = PRIORITY_COLOR[priority]
  return (
    <span role="img" aria-label={PRIORITIES[priority].label} title={PRIORITIES[priority].label} className="inline-grid shrink-0 place-items-center">
      <Flag size={size} strokeWidth={2.2} style={{ color }} fill={priority ? color : 'none'} aria-hidden />
    </span>
  )
}
