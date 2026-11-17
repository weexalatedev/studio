// Small building blocks shared by the studio screens (overview, clients,
// projects, team, time). They sit on white panels over the photo.

import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { toneSolid, toneTint } from '../components/tones'
import type { Member } from './store'
import type { Tone } from '../data'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

/** Round initials chip for a team member. */
export function Avatar({ member, size = 28 }: { member?: Member | null; size?: number }) {
  const tone: Tone = member?.tone ?? 'slate'
  return (
    <span
      title={member ? `${member.name}${member.role ? ` · ${member.role}` : ''}` : 'Unassigned'}
      aria-label={member ? member.name : 'Unassigned'}
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(180deg, color-mix(in srgb, ${toneSolid(tone)} 78%, white), ${toneSolid(tone)})`,
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.3)',
      }}
    >
      {member ? initials(member.name) : '—'}
    </span>
  )
}

/** A small tinted status label. */
export function Pill({ label, tone, dot = true }: { label: string; tone: Tone; dot?: boolean }) {
  return (
    <span
      className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[11.5px] font-semibold text-ink-2"
      style={{ background: toneTint(tone, 16), boxShadow: `inset 0 0 0 1px ${toneTint(tone, 30)}` }}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ background: toneSolid(tone) }} />}
      {label}
    </span>
  )
}

/** A white panel over the photo. */
export function Panel({ children, className = '', as = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  const Tag = as
  return <Tag className={`rounded-[20px] bg-white shadow-[var(--shadow-row)] ${className}`}>{children}</Tag>
}

export function PanelHeading({ title, action, hint }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/** A KPI tile. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'inbox',
  onClick,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: Tone
  onClick?: () => void
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="grid size-6 place-items-center rounded-full" style={{ background: toneTint(tone, 14) }}>
            <Icon size={14} style={{ color: toneSolid(tone) }} aria-hidden />
          </span>
        )}
        <span className="truncate text-[12px] font-semibold tracking-[0.01em] text-muted uppercase">{label}</span>
      </div>
      <div className="mt-1.5 text-[26px] leading-none font-semibold text-ink tabular-nums">{value}</div>
      {hint && <div className="mt-1 truncate text-[12.5px] text-muted">{hint}</div>}
    </>
  )
  const className =
    'flex w-full min-w-0 flex-col rounded-[18px] bg-white p-3.5 text-left shadow-[var(--shadow-row)] transition-[transform,box-shadow] duration-150'
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} hover:-translate-y-px hover:shadow-[0_2px_6px_rgb(16_24_40/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox`}>
        {body}
      </button>
    )
  }
  return <div className={className}>{body}</div>
}

export function ProgressBar({ value, tone = 'inbox', height = 6 }: { value: number; tone?: Tone; height?: number }) {
  return (
    <span aria-hidden className="block w-full overflow-hidden rounded-full bg-line" style={{ height }}>
      <motion.span
        className="block h-full rounded-full"
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ type: 'spring', stiffness: 220, damping: 32 }}
        style={{ background: `linear-gradient(90deg, ${toneTint(tone, 55)}, ${toneSolid(tone)})` }}
      />
    </span>
  )
}

/** A labelled number input row used in the studio forms. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </label>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[14px] border border-dashed border-line-strong px-4 py-3 text-[13.5px] leading-snug text-muted">
      {children}
    </p>
  )
}
