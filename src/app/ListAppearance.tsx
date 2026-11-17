import { IconChip } from '../components/IconChip'
import { TonePicker } from '../components/TonePicker'
import { LIST_ICON_IDS, type ListIconId, type Tone } from '../data'
import { LIST_ICONS } from './listIcons'

type Props = {
  tone: Tone
  icon: ListIconId
  onChange: (patch: { tone?: Tone; icon?: ListIconId }) => void
}

/** Colour dots + an icon grid for a user list. Changes apply as you pick. */
export function ListAppearance({ tone, icon, onChange }: Props) {
  return (
    <div className="p-1">
      <p className="px-1 pb-1.5 text-[12px] font-semibold text-muted">Colour</p>
      <TonePicker value={tone} onChange={(t) => onChange({ tone: t })} />
      <p className="px-1 pt-3 pb-1.5 text-[12px] font-semibold text-muted">Icon</p>
      <div role="radiogroup" aria-label="Icon" className="grid grid-cols-6 gap-1">
        {LIST_ICON_IDS.map((id) => {
          const on = id === icon
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={LIST_ICONS[id].name}
              title={LIST_ICONS[id].name}
              onClick={() => onChange({ icon: id })}
              className={`grid size-9 place-items-center rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-inbox ${on ? 'bg-active' : 'hover:bg-hover'}`}
            >
              <IconChip icon={LIST_ICONS[id].icon} tone={on ? tone : 'slate'} size={26} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
