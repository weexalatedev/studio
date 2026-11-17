import { Star } from 'lucide-react'
import { motion } from 'motion/react'

import { SPRING } from '../lib/motion'

type Props = {
  starred: boolean
  onToggle: () => void
  size?: number
  /** Hide the empty star until the parent row is hovered. */
  quiet?: boolean
  className?: string
  /** Colour of the empty star. */
  idleTone?: string
  /** What is being starred, for the accessible name ("Star Buy milk"). */
  label?: string
}

/** Star toggle with a little pop when it turns on. */
export function StarButton({ starred, onToggle, size = 20, quiet, className = '', idleTone = 'text-faint', label }: Props) {
  const name = `${starred ? 'Unstar' : 'Star'}${label ? ` “${label}”` : ''}`
  return (
    <button
      type="button"
      aria-pressed={starred}
      aria-label={name}
      title={starred ? 'Unstar' : 'Star'}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={`hit-40 grid size-8 shrink-0 place-items-center rounded-full transition-[opacity,background-color] duration-150 hover:bg-hover focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-inbox ${
        quiet && !starred ? 'opacity-0 group-hover:opacity-100' : ''
      } ${className}`}
    >
      <motion.span
        key={starred ? 'on' : 'off'}
        initial={starred ? { scale: 0.4, rotate: -40 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={SPRING.bouncy}
        className="grid place-items-center"
      >
        <Star
          size={size}
          strokeWidth={1.8}
          className={starred ? 'text-starred' : idleTone}
          fill={starred ? 'currentColor' : 'none'}
        />
      </motion.span>
    </button>
  )
}
