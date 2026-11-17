import { AnimatePresence, motion } from 'motion/react'
import { useRef, type ReactNode } from 'react'

import { SPRING } from '../lib/motion'
import { useOverlay } from './useOverlay'

type Props = {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/** Right-hand sheet with a light scrim. Focus is trapped; Escape or a scrim click closes it. */
export function Drawer({ open, onClose, label, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useOverlay(ref, { open, onClose })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-40 bg-[#0b1d24]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white shadow-[var(--shadow-panel)] outline-none sm:inset-y-3 sm:right-3 sm:rounded-[22px]"
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={SPRING.sheet}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
