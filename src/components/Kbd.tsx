import type { ReactNode } from 'react'

/** A keycap for shortcut hints. */
export function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={`inline-grid h-[22px] min-w-[22px] place-items-center rounded-[6px] border border-line-strong bg-white px-1.5 font-sans text-[11.5px] font-semibold text-ink-2 shadow-[0_1px_0_var(--color-line-strong)] ${className}`}
    >
      {children}
    </kbd>
  )
}
