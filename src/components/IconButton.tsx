import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
  /** `plain` for white surfaces, `glass` over the photo. */
  variant?: 'plain' | 'glass'
  size?: 'sm' | 'md'
  active?: boolean
}

/** A square, icon-only button with an accessible label and a soft press. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, children, variant = 'plain', size = 'md', active, className = '', ...rest },
  ref,
) {
  const box = size === 'sm' ? 'size-7 rounded-lg' : 'size-8 rounded-[10px]'
  // Invisible 40px hit area for touch, without changing the visual size.
  const hit = className.includes('absolute') ? 'after:absolute after:-inset-1.5 after:content-[\'\']' : 'hit-40'
  const tone =
    variant === 'glass'
      ? 'text-ink-2/80 hover:bg-white/60 hover:text-ink'
      : 'text-muted hover:bg-hover hover:text-ink'
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`inline-grid shrink-0 place-items-center transition-[background-color,color,transform] duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-inbox ${box} ${hit} ${tone} ${active ? 'bg-hover text-ink' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})
