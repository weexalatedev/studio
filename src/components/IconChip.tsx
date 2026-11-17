import type { LucideIcon } from 'lucide-react'

import type { Tone } from '../data'
import { TONES } from './tones'

type Props = {
  icon: LucideIcon
  tone: Tone
  size?: number
  /** Fill the glyph (used for the star). */
  filled?: boolean
  className?: string
}

/** A round, gradient-filled chip holding a white glyph: the smart-list mark. */
export function IconChip({ icon: Icon, tone, size = 28, filled, className = '' }: Props) {
  const [a, b] = TONES[tone]
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${a}, ${b})`,
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.35), 0 1px 2px rgb(16 24 40 / 0.15)',
      }}
    >
      <Icon
        size={Math.round(size * 0.56)}
        strokeWidth={2.1}
        fill={filled ? 'currentColor' : 'none'}
      />
    </span>
  )
}
