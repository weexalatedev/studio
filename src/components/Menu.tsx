import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon?: LucideIcon
  /** Colour class for the icon, e.g. `text-today`. */
  iconClass?: string
  /** Anything before the label instead of an icon (a dot, a chip). */
  leading?: ReactNode
  label: ReactNode
  /** Right-aligned hint: a date, a shortcut, a check. */
  trailing?: ReactNode
  danger?: boolean
  selected?: boolean
}

/** One row in a popover menu: icon, label, optional hint. */
export function MenuItem({ icon: Icon, iconClass = '', leading, label, trailing, danger, selected, className = '', ...rest }: ItemProps) {
  return (
    <button
      type="button"
      className={`flex h-9 w-full items-center max-sm:h-11 gap-2.5 rounded-[10px] px-2.5 text-left text-[14px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-inbox disabled:pointer-events-none disabled:opacity-40 ${
        danger ? 'text-danger-ink hover:bg-danger/8' : 'text-ink hover:bg-hover'
      } ${selected ? 'bg-active' : ''} ${className}`}
      {...rest}
    >
      {leading ?? (Icon && <Icon size={16} className={`shrink-0 ${iconClass}`} aria-hidden />)}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing && <span className="shrink-0 text-[12px] text-muted">{trailing}</span>}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="mx-1 my-1.5 h-px bg-line" />
}

/** Small uppercase-free heading inside a menu or sheet. */
export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pt-1.5 pb-1 text-[12px] font-semibold text-muted">{children}</p>
}
