import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const FIELD =
  'w-full rounded-[var(--radius-field)] border bg-[#fafafb] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:bg-white disabled:opacity-50'
const OK = 'border-line focus:border-inbox/50 focus:shadow-[0_0_0_3px_rgb(31_124_246/0.12)]'
const BAD = 'border-danger/60 focus:shadow-[0_0_0_3px_rgb(239_68_68/0.14)]'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { invalid?: boolean; size?: 'sm' | 'md' }

/** Single-line field on white panels. `invalid` turns the border red (pair it with an error message). */
export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput(
  { invalid, size = 'md', className = '', ...rest },
  ref,
) {
  const box = size === 'sm' ? 'h-9 px-3 text-[14px]' : 'h-11 px-3.5 text-[15px]'
  return <input ref={ref} aria-invalid={invalid || undefined} className={`${FIELD} ${invalid ? BAD : OK} ${box} ${className}`} {...rest} />
})

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }

export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea({ invalid, className = '', ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${FIELD} ${invalid ? BAD : OK} resize-none rounded-[16px] px-4 py-3 text-[15px] leading-[1.55] text-ink-2 ${className}`}
      {...rest}
    />
  )
})
