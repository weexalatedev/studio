import { X } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { Tone } from '../data'
import { toneSolid, toneTint } from './tones'

type Props = {
  name: string
  tone: Tone
  size?: 'sm' | 'md'
  /** Makes the chip a toggle button (tag filter). */
  selected?: boolean
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Adds a small × that calls this. */
  onRemove?: () => void
  className?: string
}

/** A coloured tag pill: tinted fill, coloured dot, ink text (AA on every tone). */
export function TagChip({ name, tone, size = 'sm', selected, onClick, onRemove, className = '' }: Props) {
  const box = size === 'sm' ? 'h-[22px] px-2 text-[12px] gap-1' : 'h-8 px-3 text-[13px] gap-1.5'
  const style = {
    background: toneTint(tone, selected ? 34 : 14),
    boxShadow: selected ? `inset 0 0 0 1.5px ${toneSolid(tone)}` : `inset 0 0 0 1px ${toneTint(tone, 28)}`,
  }
  const content = (
    <>
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: toneSolid(tone) }} />
      <span className="truncate">{name}</span>
    </>
  )
  const base = `inline-flex max-w-[160px] shrink-0 items-center rounded-full font-semibold ${selected ? 'text-ink' : 'text-ink-2'} ${box} ${className}`
  if (onClick) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        style={style}
        className={`${base} hit-40 transition-[transform,background-color] duration-150 hover:brightness-[0.97] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox`}
      >
        {content}
      </button>
    )
  }
  return (
    <span style={style} className={`${base} ${onRemove ? 'pr-1' : ''}`}>
      {content}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${name}`}
          onClick={onRemove}
          className="hit-40 -my-1 grid size-6 place-items-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-inbox"
        >
          <X size={12} strokeWidth={2.6} />
        </button>
      )}
    </span>
  )
}
