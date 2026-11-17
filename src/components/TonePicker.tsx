import { Check } from 'lucide-react'

import type { Tone } from '../data'
import { TONES } from './tones'

export const PICKABLE_TONES: Tone[] = ['inbox', 'teal', 'green', 'starred', 'today', 'rose', 'upcoming', 'slate']

const TONE_NAMES: Record<Tone, string> = {
  inbox: 'Blue',
  today: 'Orange',
  upcoming: 'Purple',
  starred: 'Yellow',
  teal: 'Teal',
  rose: 'Rose',
  green: 'Green',
  slate: 'Slate',
}

/** A row of colour dots; the chosen one gets a ring and a tick. */
export function TonePicker({ value, onChange, label = 'Colour' }: { value: Tone; onChange: (t: Tone) => void; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
      {PICKABLE_TONES.map((t) => {
        const [a, b] = TONES[t]
        const on = t === value
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={TONE_NAMES[t]}
            title={TONE_NAMES[t]}
            onClick={() => onChange(t)}
            className="grid size-8 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-inbox"
          >
            <span
              className={`grid size-6 place-items-center rounded-full text-white ${on ? 'ring-2 ring-offset-2 ring-offset-white' : ''}`}
              style={{ background: `linear-gradient(180deg, ${a}, ${b})`, ['--tw-ring-color' as string]: b }}
            >
              {on && <Check size={13} strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
