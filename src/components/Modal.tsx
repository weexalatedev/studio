import { AnimatePresence, motion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { SPRING } from '../lib/motion'
import { useOverlay } from './useOverlay'

type Props = {
  open: boolean
  onClose: () => void
  /** Accessible name of the dialog. */
  label: string
  children: ReactNode
  /** Max width in px. */
  width?: number
  /** Where the panel sits: near the top (command palette) or centred. */
  placement?: 'top' | 'center'
  className?: string
}

/** Centred dialog over a soft scrim. Focus is trapped; Escape or a scrim click closes it. */
export function Modal({ open, onClose, label, children, width = 560, placement = 'center', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useOverlay(ref, { open, onClose })

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          key="modal"
          className={`fixed inset-0 z-[70] flex justify-center px-3 ${placement === 'top' ? 'items-start pt-[12vh]' : 'items-center py-6'}`}
        >
          <motion.div
            className="absolute inset-0 bg-[#0b1d24]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.14 } }}
            transition={SPRING.pop}
            className={`relative flex max-h-[min(640px,80dvh)] w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-panel)] outline-none ${className}`}
            style={{ maxWidth: width }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
