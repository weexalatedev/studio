import { CalendarClock, CalendarDays, CalendarRange, Repeat, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../components/Button'
import { MenuItem, MenuSeparator } from '../components/Menu'
import { SegmentedControl } from '../components/SegmentedControl'
import { Stepper } from '../components/Stepper'
import type { RepeatUnit } from '../lib/dates'
import type { Repeat as RepeatRule } from './store'

const UNIT_WORD: Record<RepeatUnit, [string, string]> = {
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months'],
}

/** "Daily", "Weekly", "Every 3 days". */
export function repeatLabel(r: RepeatRule): string {
  if (r.every === 1) return r.unit === 'day' ? 'Daily' : r.unit === 'week' ? 'Weekly' : 'Monthly'
  return `Every ${r.every} ${UNIT_WORD[r.unit][1]}`
}

const PRESETS: { label: string; rule: RepeatRule; icon: typeof Repeat }[] = [
  { label: 'Daily', rule: { every: 1, unit: 'day' }, icon: CalendarDays },
  { label: 'Weekly', rule: { every: 1, unit: 'week' }, icon: CalendarRange },
  { label: 'Monthly', rule: { every: 1, unit: 'month' }, icon: CalendarClock },
]

const same = (a: RepeatRule | null, b: RepeatRule) => !!a && a.every === b.every && a.unit === b.unit

/** Daily / weekly / monthly presets and a custom "every N units" editor. */
export function RepeatPicker({ value, onChange }: { value: RepeatRule | null; onChange: (r: RepeatRule | null) => void }) {
  const isPreset = PRESETS.some((p) => same(value, p.rule))
  const [custom, setCustom] = useState(!!value && !isPreset)
  const [every, setEvery] = useState(value?.every ?? 2)
  const [unit, setUnit] = useState<RepeatUnit>(value?.unit ?? 'day')

  if (custom) {
    return (
      <div className="p-1.5">
        <p className="text-[13px] font-semibold text-ink">Custom repeat</p>
        <div className="mt-3 flex items-center gap-2 text-[14px] text-ink-2">
          Every
          <Stepper value={every} onChange={setEvery} min={1} max={365} label="Interval" />
        </div>
        <SegmentedControl
          className="mt-3"
          variant="solid"
          clearable={false}
          label="Unit"
          value={unit}
          onChange={(u) => u && setUnit(u)}
          options={(['day', 'week', 'month'] as const).map((u) => ({ id: u, label: UNIT_WORD[u][every === 1 ? 0 : 1] }))}
        />
        <div className="mt-3 flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setCustom(false)}>
            Back
          </Button>
          <Button size="sm" variant="primary" onClick={() => onChange({ every, unit })}>
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {PRESETS.map((p) => (
        <MenuItem key={p.label} icon={p.icon} iconClass="text-upcoming" label={p.label} selected={same(value, p.rule)} onClick={() => onChange(p.rule)} />
      ))}
      <MenuItem
        icon={SlidersHorizontal}
        iconClass="text-inbox"
        label="Custom…"
        trailing={value && !isPreset ? repeatLabel(value) : undefined}
        selected={!!value && !isPreset}
        onClick={() => setCustom(true)}
      />
      {value && (
        <>
          <MenuSeparator />
          <MenuItem icon={X} label="Don’t repeat" danger onClick={() => onChange(null)} />
        </>
      )}
    </div>
  )
}
