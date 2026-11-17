import { Search, X } from 'lucide-react'
import { forwardRef } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** Bordered search input with a clear button. */
export const SearchField = forwardRef<HTMLInputElement, Props>(function SearchField(
  { value, onChange, placeholder },
  ref,
) {
  return (
    <label className="group relative flex h-11 items-center gap-2.5 rounded-[var(--radius-field)] border border-line bg-white px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-inbox/50 focus-within:shadow-[0_0_0_3px_rgb(31_124_246/0.12)]">
      <Search size={17} strokeWidth={2} className="shrink-0 text-ink-2/80" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('')
            e.currentTarget.blur()
          }
        }}
        placeholder={placeholder}
        aria-label="Search tasks"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="grid size-5 place-items-center rounded-full bg-faint/60 text-white transition-colors hover:bg-muted"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </label>
  )
})
