import { forwardRef, type SelectHTMLAttributes } from 'react'

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  options: { value: string; label: string }[]
  label: string
  size?: 'sm' | 'md'
}

/** A compact native select, styled to match the text fields. */
export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { options, label, size = 'md', className = '', ...rest },
  ref,
) {
  const box = size === 'sm' ? 'h-8 pl-2.5 pr-7 text-[13px]' : 'h-9 pl-3 pr-8 text-[14px]'
  return (
    <span className={`relative inline-flex min-w-0 ${className}`}>
      <select
        ref={ref}
        aria-label={label}
        className={`w-full min-w-0 appearance-none truncate rounded-[10px] border border-line bg-white font-medium text-ink outline-none transition-[border-color,box-shadow] focus:border-inbox/50 focus:shadow-[0_0_0_3px_rgb(31_124_246/0.12)] ${box}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
})
