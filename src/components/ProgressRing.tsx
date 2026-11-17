import { motion } from 'motion/react'

type Props = {
  done: number
  total: number
  size?: number
  /** Show "2/5" next to the ring. */
  showLabel?: boolean
  className?: string
}

/** Subtask progress: a ring that fills as subtasks are ticked, green when all are done. */
export function ProgressRing({ done, total, size = 18, showLabel = true, className = '' }: Props) {
  const stroke = 2.4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = total ? done / total : 0
  const complete = total > 0 && done === total
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold tabular-nums ${complete ? 'text-success-ink' : 'text-muted'} ${className}`}
      role="img"
      aria-label={`${done} of ${total} subtasks done`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-strong)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={complete ? 'var(--color-success)' : 'var(--color-inbox)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        />
      </svg>
      {showLabel && (
        <span aria-hidden>
          {done}/{total}
        </span>
      )}
    </span>
  )
}
