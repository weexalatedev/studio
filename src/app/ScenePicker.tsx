import { Check } from 'lucide-react'

import { Landscape } from '../components/Landscape'
import { SCENES, type SceneId } from '../data'

/** Four mini landscapes as a radio group. */
export function ScenePicker({ value, onChange, columns = 2 }: { value: SceneId; onChange: (s: SceneId) => void; columns?: 2 | 4 }) {
  return (
    <div role="radiogroup" aria-label="Background" className={`grid gap-2 ${columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
      {SCENES.map((s) => {
        const on = s.id === value
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(s.id)}
            className={`group relative overflow-hidden rounded-[14px] text-left ring-offset-2 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inbox ${
              on ? 'ring-2 ring-inbox' : 'ring-1 ring-black/10'
            }`}
          >
            <Landscape scene={s.id} className="block aspect-[16/10] w-full" />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-2.5 pt-5 pb-1.5 text-[13px] font-semibold text-white">
              {s.name}
              {on && (
                <span className="grid size-5 place-items-center rounded-full bg-white text-inbox-ink">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
