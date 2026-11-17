import type { ReactNode } from 'react'

/** Group heading over the photo ("No Date", "Today", "Completed"). */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-[16px] pt-[22px] pb-[8px]">
      <h2 className="text-photo text-[13px] font-semibold tracking-[0.01em]">{children}</h2>
      {action}
    </div>
  )
}
