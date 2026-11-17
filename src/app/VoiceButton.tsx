import { Mic, MicOff, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

type Props = {
  listening: boolean
  transcript: string
  error: string | null
  supported: boolean
  onStart: () => void
  onStop: () => void
  onDismissError: () => void
}

const EXAMPLES = [
  'add task Review Q4 invoices for Halcyon',
  'complete task Present the Halcyon identity routes',
  'show client Meridian',
  'log 2 hours to Patient portal by Sam',
  'new project Brand refresh for Halcyon',
  'assign Ship the booking API to Dev',
  'move Accessibility pass to in review',
  'open timesheet',
]

/** Floating mic control for the voice command bar. */
export function VoiceButton({ listening, transcript, error, supported, onStart, onStop, onDismissError }: Props) {
  const [help, setHelp] = useState(false)

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {(listening || transcript || error) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="max-w-[min(92vw,380px)] rounded-[16px] bg-white p-3 shadow-[var(--shadow-panel)]"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${listening ? 'animate-pulse bg-inbox' : 'bg-line-strong'}`} />
              <p className="text-[12px] font-semibold tracking-[0.01em] text-muted uppercase">
                {error ? 'Voice error' : listening ? 'Listening' : 'Heard'}
              </p>
              {error && (
                <button type="button" onClick={onDismissError} aria-label="Dismiss error" className="ml-auto text-muted hover:text-ink">
                  <X size={13} />
                </button>
              )}
            </div>
            <p className="mt-1 text-[13.5px] leading-snug text-ink">
              {error ?? (transcript || 'Say a command…')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {help && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="max-w-[min(92vw,340px)] rounded-[16px] bg-white p-3.5 shadow-[var(--shadow-panel)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink">Voice commands</p>
              <button type="button" onClick={() => setHelp(false)} aria-label="Close examples" className="text-muted hover:text-ink">
                <X size={13} />
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {EXAMPLES.map((e) => (
                <li key={e} className="rounded-[8px] bg-hover px-2 py-1.5 text-[12.5px] leading-snug text-ink-2">
                  “{e}”
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] leading-snug text-muted">
              {supported
                ? 'Press the mic and speak, or hit Ctrl+Shift+V. External agents can call window.studioVoice.runCommand(text).'
                : 'This browser has no speech API. External agents can call window.studioVoice.runCommand(text).'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1.5 rounded-full bg-white p-1 shadow-[var(--shadow-panel)]">
        <button
          type="button"
          onClick={() => setHelp((h) => !h)}
          aria-label="Voice command examples"
          className="grid size-8 place-items-center rounded-full text-[12px] font-semibold text-muted hover:bg-hover hover:text-ink"
        >
          ?
        </button>
        <button
          type="button"
          onClick={listening ? onStop : onStart}
          aria-pressed={listening}
          aria-label={listening ? 'Stop listening' : 'Start voice command'}
          className={`grid size-11 place-items-center rounded-full text-white transition-transform active:scale-95 ${
            listening ? 'bg-danger' : 'bg-inbox hover:brightness-110'
          }`}
          style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.3)' }}
        >
          {listening ? <MicOff size={19} strokeWidth={2} /> : <Mic size={19} strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}