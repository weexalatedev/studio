import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

import { Spinner } from './Spinner'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `danger` is a quiet red text button; `destructive` is the solid red confirm. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive'
  size?: 'sm' | 'md'
  /** Shows a spinner, keeps the width and blocks clicks. */
  loading?: boolean
  children: ReactNode
}

const VARIANTS = {
  primary: 'bg-inbox-ink text-white hover:bg-[#1259bd] shadow-[0_1px_2px_rgb(16_24_40/0.15)]',
  secondary: 'bg-hover text-ink hover:bg-line',
  ghost: 'text-ink-2 hover:bg-hover',
  danger: 'text-danger-ink hover:bg-danger/10',
  destructive: 'bg-danger-ink text-white hover:bg-[#a51c1c] shadow-[0_1px_2px_rgb(16_24_40/0.15)]',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', loading, disabled, className = '', children, ...rest },
  ref,
) {
  const box = size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm'
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`hit-40 inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-[background-color,transform,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox ${box} ${VARIANTS[variant]} ${loading ? '!opacity-100' : ''} ${className}`}
      {...rest}
    >
      <span className={`inline-flex items-center gap-1.5 ${loading ? 'opacity-0' : ''}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={size === 'sm' ? 14 : 16} />
        </span>
      )}
    </button>
  )
})
