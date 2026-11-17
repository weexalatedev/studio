import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

import { SPRING } from '../lib/motion'

export type ToastData = {
  key: number
  message: ReactNode
  /** Optional action, e.g. Undo. */
  action?: { label: string; run: () => void }
  tone?: 'default' | 'error'
}

/** Dark pill at the bottom centre. Pass `null` to hide it. */
export function Toast({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={SPRING.snappy}
            className={`pointer-events-auto flex max-w-full items-center gap-3 rounded-full py-2 pl-4 text-[14px] text-white shadow-[var(--shadow-pop)] backdrop-blur-md ${
              toast.action ? 'pr-2' : 'pr-4'
            } ${toast.tone === 'error' ? 'bg-[#a51c1c]/95' : 'bg-[#1c1d21]/90'}`}
          >
            <span className="min-w-0 truncate">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run()
                  onDismiss()
                }}
                className="min-h-8 shrink-0 rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
