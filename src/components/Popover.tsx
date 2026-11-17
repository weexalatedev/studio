import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

import { SPRING } from '../lib/motion'
import { useOverlay } from './useOverlay'

type Props = {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  /** Accessible name for the floating panel. */
  label?: string
  /** Which edge of the anchor the popover lines up with. */
  align?: 'start' | 'end'
  width?: number
}

const GAP = 8
const MARGIN = 12

/**
 * A floating panel pinned under (or above, when there is no room) an anchor.
 * Closes on outside click and Escape; stays inside the viewport. Focus moves
 * into the panel on open and back to the anchor on close.
 */
export function Popover({ open, onClose, anchorRef, children, label, align = 'end', width = 280 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; origin: string } | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect()
      if (!a) return
      const h = panelRef.current?.offsetHeight ?? 320
      const w = Math.min(width, window.innerWidth - MARGIN * 2)
      let left = align === 'end' ? a.right - w : a.left
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - w - MARGIN))
      const below = a.bottom + GAP
      const fitsBelow = below + h < window.innerHeight - MARGIN
      const top = fitsBelow ? below : Math.max(MARGIN, a.top - GAP - h)
      setPos({ top, left, origin: `${align === 'end' ? 'right' : 'left'} ${fitsBelow ? 'top' : 'bottom'}` })
    }
    place()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchorRef, align, width])

  useOverlay(panelRef, { open, onClose })

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, onClose, anchorRef])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -2, transition: { duration: 0.12 } }}
          transition={SPRING.pop}
          className="fixed z-[60] rounded-[var(--radius-panel)] bg-white p-2 shadow-[var(--shadow-pop)] ring-1 ring-black/5 outline-none"
          style={{
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            width: Math.min(width, typeof window === 'undefined' ? width : window.innerWidth - MARGIN * 2),
            transformOrigin: pos?.origin,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
