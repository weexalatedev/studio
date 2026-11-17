import { Minus, Plus } from 'lucide-react'

import { IconButton } from './IconButton'

type Props = { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }

/** − value + number control. */
export function Stepper({ value, onChange, min = 1, max = 99, label }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)))
  return (
    <div className="inline-flex h-9 items-center rounded-[10px] bg-hover px-0.5" role="group" aria-label={label}>
      <IconButton size="sm" label={`Decrease ${label}`} disabled={value <= min} onClick={() => set(value - 1)} className="disabled:opacity-30">
        <Minus size={14} />
      </IconButton>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => set(Number(e.target.value) || min)}
        className="w-9 bg-transparent text-center text-[14px] font-semibold tabular-nums text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <IconButton size="sm" label={`Increase ${label}`} disabled={value >= max} onClick={() => set(value + 1)} className="disabled:opacity-30">
        <Plus size={14} />
      </IconButton>
    </div>
  )
}
