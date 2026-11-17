type Props = {
  checked: boolean
  onChange: () => void
  label: string
  size?: number
}

/** Round completion checkbox. The tick draws itself and the ring fills. The hit area is 40px. */
export function Checkbox({ checked, onChange, label, size = 22 }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-checked={checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className="group/check hit-40 grid shrink-0 place-items-center rounded-full transition-transform duration-150 active:scale-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox"
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-200 ${
          checked
            ? 'scale-100 border-inbox bg-inbox'
            : 'border-line-strong bg-white group-hover/check:border-inbox/60'
        }`}
      />
      <svg viewBox="0 0 16 16" className="relative size-[62%]" aria-hidden>
        <path
          className="check-path"
          d="M3.2 8.4 L6.6 11.6 L12.8 4.6"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
