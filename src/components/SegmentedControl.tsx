import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'

type Option<T extends string | number> = { id: T; label: string; icon?: ReactNode; count?: number }

type Props<T extends string | number> = {
  options: Option<T>[]
  value: T | null
  /** Called with null when the active segment is clicked again (if `clearable`). */
  onChange: (value: T | null) => void
  label: string
  /** `frost` sits on the photo; `solid` sits on white panels. */
  variant?: 'frost' | 'solid'
  /** Clicking the active segment clears the value. */
  clearable?: boolean
  className?: string
}

/**
 * Segmented filter with a sliding white thumb. The frosted version starts
 * with nothing selected; clicking the active segment again clears it.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
  variant = 'frost',
  clearable = true,
  className = '',
}: Props<T>) {
  const id = useId()
  const solid = variant === 'solid'
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`scrollbar-none flex overflow-x-auto rounded-full p-[3px] ${solid ? 'h-[36px] bg-hover' : 'frost h-[38px]'} ${className}`}
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={String(o.id)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active && clearable ? null : o.id)}
            className={`hit-40 flex flex-none items-center justify-center gap-1.5 rounded-full whitespace-nowrap ${solid ? '' : 'px-3'} transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox sm:min-w-0 sm:flex-1 ${
              solid ? 'px-2 text-[13px]' : 'text-[13.5px] sm:px-1 sm:text-[14px]'
            } ${active ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgb(16_24_40/0.12)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.icon && <span className="relative grid place-items-center">{o.icon}</span>}
            <span className="relative truncate">{o.label}</span>
            {o.count ? (
              <span className={`relative hidden text-[11px] tabular-nums sm:inline ${active ? 'text-muted' : 'text-muted/80'}`}>
                {o.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
