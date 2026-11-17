import { motion } from 'motion/react'
import { useId } from 'react'

import type { Tone } from '../data'
import { EASE_OUT } from '../lib/motion'
import { toneSolid } from './tones'

type Props = {
  title: string
  body: string
  tone?: Tone
  /** "all done" shows a tick in the sun; otherwise a quiet horizon. */
  done?: boolean
  className?: string
}

/** A calm frosted card with a tiny horizon: used when a view has nothing open. */
export function EmptyState({ title, body, tone = 'inbox', done, className = '' }: Props) {
  const c = toneSolid(tone)
  const gid = `es-${useId().replace(/:/g, '')}`
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={`frost mt-[22px] flex flex-col items-center rounded-[24px] px-6 pt-6 pb-7 text-center ${className}`}
    >
      <svg width="112" height="64" viewBox="0 0 112 64" aria-hidden className="animate-float">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity="0.95" />
            <stop offset="1" stopColor={c} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <circle cx="56" cy="34" r="20" fill={`url(#${gid})`} />
        {done && (
          <path d="M47 34.5 L53.5 41 L66 28" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
        <path d="M0 52 C22 42 38 46 56 50 C74 54 92 44 112 48 L112 64 L0 64 Z" fill="#ffffff" opacity="0.9" />
        <path d="M0 58 C26 52 46 58 64 57 C84 56 98 52 112 55 L112 64 L0 64 Z" fill={c} opacity="0.18" />
      </svg>
      <h2 className="mt-3 text-[17px] font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-[340px] text-[14.5px] leading-[1.5] text-ink-2">{body}</p>
    </motion.div>
  )
}
