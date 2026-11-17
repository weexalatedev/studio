import { ArrowLeft, CalendarDays, Inbox, Pencil, Plus, RotateCcw, Star, Trash2, X } from 'lucide-react'
import { MotionConfig, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { TaskRow } from '../app/TaskRow'
import { DragProvider } from '../app/dnd'
import { newTask, type Tag } from '../app/store'
import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { DatePicker } from '../components/DatePicker'
import { Drawer } from '../components/Drawer'
import { DueBadge } from '../components/DueBadge'
import { EmptyState } from '../components/EmptyState'
import { IconButton } from '../components/IconButton'
import { IconChip } from '../components/IconChip'
import { Kbd } from '../components/Kbd'
import { MenuItem, MenuLabel, MenuSeparator } from '../components/Menu'
import { Modal } from '../components/Modal'
import { Popover } from '../components/Popover'
import { PriorityFlag } from '../components/PriorityFlag'
import { ProgressRing } from '../components/ProgressRing'
import { Scenery } from '../components/Scenery'
import { SearchField } from '../components/SearchField'
import { SectionLabel } from '../components/SectionLabel'
import { SegmentedControl } from '../components/SegmentedControl'
import { Spinner } from '../components/Spinner'
import { StarButton } from '../components/StarButton'
import { Stepper } from '../components/Stepper'
import { TagChip } from '../components/TagChip'
import { TextArea, TextInput } from '../components/TextField'
import { Toast, type ToastData } from '../components/Toast'
import { TonePicker } from '../components/TonePicker'
import { APP_NAME, SCENES, type Priority, type SceneId, type Tone } from '../data'
import { addDays, todayKey } from '../lib/dates'
import { DURATION, EASE_OUT, SPRING } from '../lib/motion'
import { Link } from '../router'
import { COLOR_GROUPS, DURATIONS, EASINGS, RADII, SHADOWS, SPACING, TYPE_SCALE } from './tokens'

const SECTIONS = [
  ['colour', 'Colour'],
  ['type', 'Typography'],
  ['spacing', 'Spacing'],
  ['radii', 'Radii'],
  ['elevation', 'Elevation'],
  ['motion', 'Motion'],
  ['buttons', 'Buttons'],
  ['icon-buttons', 'Icon buttons'],
  ['chips', 'Icon chips'],
  ['toggles', 'Checkbox & star'],
  ['fields', 'Fields'],
  ['segmented', 'Segmented control'],
  ['tags', 'Tags, flags, progress'],
  ['badges', 'Due badges & keys'],
  ['menus', 'Menus & popovers'],
  ['pickers', 'Pickers'],
  ['overlays', 'Modal, drawer, toast'],
  ['photo', 'On the photo'],
  ['scenes', 'Scenes'],
  ['rows', 'Task rows'],
] as const

const TONES: Tone[] = ['inbox', 'today', 'upcoming', 'starred', 'teal', 'rose', 'green', 'slate']

/** Live documentation of Studio's tokens and components, rendered by the real components. */
export default function StyleGuide() {
  useEffect(() => {
    document.title = `Style guide · ${APP_NAME}`
    const prev = document.body.style.background
    document.body.style.background = '#f6f7f9'
    return () => {
      document.title = APP_NAME
      document.body.style.background = prev
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="h-dvh overflow-y-auto bg-[#f6f7f9] text-ink">
        <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 sm:px-6">
            <Link
              to="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-2 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-inbox"
            >
              <ArrowLeft size={16} aria-hidden /> Back to {APP_NAME}
            </Link>
            <span className="h-5 w-px bg-line" aria-hidden />
            <p className="truncate text-[15px] font-semibold">Style guide</p>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1200px] gap-10 px-4 sm:px-6">
          <nav aria-label="Style guide sections" className="sticky top-14 hidden h-[calc(100dvh-56px)] w-[200px] shrink-0 overflow-y-auto py-8 lg:block">
            <ul className="flex flex-col gap-0.5">
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block rounded-[10px] px-3 py-1.5 text-[14px] text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-inbox"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0 flex-1 pt-8 pb-24">
            <h1 className="text-[34px] font-semibold tracking-[-0.01em]">{APP_NAME} design system</h1>
            <p className="mt-2 max-w-[620px] text-[16px] leading-[1.55] text-ink-2">
              White panels and pill rows floating over a full-bleed landscape. Everything below is rendered by the components in{' '}
              <code className="rounded bg-white px-1 text-[14px]">src/components/</code>; tokens live in{' '}
              <code className="rounded bg-white px-1 text-[14px]">src/styles.css</code>. There is one light theme; the four background scenes act as
              the ambient theme, so photo-facing components are shown over each scene.
            </p>

            <Colours />
            <Typography />
            <Spacing />
            <Radii />
            <Elevation />
            <Motion />
            <Buttons />
            <IconButtons />
            <Chips />
            <Toggles />
            <Fields />
            <Segmented />
            <TagsFlags />
            <BadgesKeys />
            <Menus />
            <Pickers />
            <Overlays />
            <OnPhoto />
            <Scenes />
            <Rows />
          </main>
        </div>
      </div>
    </MotionConfig>
  )
}

// ---------------------------------------------------------------------------------- layout

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 pt-14">
      <h2 id={`${id}-h`} className="text-[24px] font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {intro && <p className="mt-1.5 max-w-[680px] text-[15px] leading-[1.55] text-ink-2">{intro}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Card({ title, usage, children, className = '' }: { title?: string; usage?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className="rounded-[18px] bg-white p-5 shadow-[0_0_0_1px_rgb(16_24_40/0.05),0_1px_2px_rgb(16_24_40/0.04)]">
      {title && <h3 className="text-[15px] font-semibold">{title}</h3>}
      {usage && <p className="mt-1 max-w-[680px] text-[14px] leading-[1.5] text-muted">{usage}</p>}
      <div className={`${title || usage ? 'mt-4' : ''} ${className}`}>{children}</div>
    </div>
  )
}

/** A labelled cell in a demo grid. */
function Demo({ label, children, className = '', onPhoto }: { label: string; children: ReactNode; className?: string; onPhoto?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className={`flex min-h-10 items-center ${className}`}>{children}</div>
      <span className={`text-[12px] font-semibold ${onPhoto ? 'text-photo' : 'text-muted'}`}>{label}</span>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-x-6 gap-y-5">{children}</div>
}

/** Forces a simulated interaction state on its child (style guide only). */
function Force({ state, children }: { state: 'hover' | 'focus' | 'active'; children: ReactNode }) {
  return <span className={`sg-${state} inline-flex`}>{children}</span>
}

/** A strip of landscape behind photo-facing components. */
function PhotoStage({ scene, children, className = '' }: { scene: SceneId; children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[16px] ${className}`}>
      <Scenery scene={scene} className="absolute inset-0" />
      <div className="relative p-5">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------------- tokens

function Colours() {
  return (
    <Section id="colour" title="Colour" intro="Tokens are Tailwind theme colours: use them as bg-ink, text-muted, border-line, text-today-ink and so on.">
      {COLOR_GROUPS.map((g) => (
        <Card key={g.title} title={g.title} usage={g.note}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {g.tokens.map((t) => (
              <li key={t.name} className="overflow-hidden rounded-[14px] ring-1 ring-black/5">
                <div className="h-14" style={{ background: `var(--color-${t.name}, ${t.value})` }} />
                <div className="px-3 py-2">
                  <p className="text-[13px] font-semibold">{t.name}</p>
                  <p className="font-mono text-[12px] text-muted">{t.value}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.use}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </Section>
  )
}

function Typography() {
  return (
    <Section id="type" title="Typography" intro="Nunito Sans (Google Fonts) with system fallbacks. Every size and weight in the app:">
      <Card>
        <ul className="divide-y divide-line">
          {TYPE_SCALE.map((t) => (
            <li key={`${t.size}-${t.weight}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-[120px] shrink-0 font-mono text-[12px] text-muted">
                {t.size}px / {t.weight}
              </span>
              <span className="min-w-0 flex-1 truncate" style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: t.leading }}>
                {t.sample}
              </span>
              <span className="text-[13px] text-muted sm:w-[260px] sm:shrink-0">{t.use}</span>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

function Spacing() {
  return (
    <Section id="spacing" title="Spacing" intro="A 4px rhythm with a few reference-matched offsets (13, 18, 22, 37) for the main column.">
      <Card>
        <ul className="flex flex-col gap-2">
          {SPACING.map((n) => (
            <li key={n} className="flex items-center gap-4">
              <span className="w-12 shrink-0 font-mono text-[12px] text-muted">{n}px</span>
              <span className="h-3 rounded-full bg-inbox/70" style={{ width: n * 4 }} />
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

function Radii() {
  return (
    <Section id="radii" title="Radii">
      <Card>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-7">
          {RADII.map((r) => (
            <li key={r.name} className="flex flex-col gap-2">
              <span className="h-16 border-2 border-inbox/50 bg-inbox/8" style={{ borderRadius: r.value }} />
              <span className="text-[13px] font-semibold">{r.name}</span>
              <span className="text-[12px] leading-snug text-muted">{r.use}</span>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

function Elevation() {
  return (
    <Section id="elevation" title="Elevation" intro="Three shadows on white, plus the frost utility for anything translucent over the photo.">
      <Card className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {SHADOWS.map((s) => (
          <div key={s.name} className="flex flex-col gap-3">
            <span className="h-20 rounded-[18px] bg-white" style={{ boxShadow: s.value }} />
            <span className="text-[13px] font-semibold">{s.name}</span>
            <span className="text-[12px] text-muted">{s.use}</span>
          </div>
        ))}
      </Card>
      <PhotoStage scene="dusk">
        <div className="flex flex-wrap gap-4">
          <div className="frost rounded-full px-5 py-3 text-[15px] text-ink-2">frost: add bar, filters, empty states</div>
          <div className="text-photo self-center text-[15px] font-semibold">text-photo: labels on the photo</div>
        </div>
      </PhotoStage>
    </Section>
  )
}

function Motion() {
  const [run, setRun] = useState(0)
  return (
    <Section
      id="motion"
      title="Motion"
      intro={
        <>
          CSS tokens (<code>--duration-*</code>, <code>--ease-*</code>) and their JS mirror in <code>src/lib/motion.ts</code>. With{' '}
          <code>prefers-reduced-motion: reduce</code> transforms are dropped and CSS transitions become instant.
        </>
      }
    >
      <Card
        title="Durations and easings"
        usage="Press replay to run each track."
      >
        <Button size="sm" onClick={() => setRun((r) => r + 1)}>
          <RotateCcw size={14} /> Replay
        </Button>
        <ul className="mt-4 flex flex-col gap-3">
          {DURATIONS.map((d) => (
            <Track key={d.name} run={run} label={`${d.name} · ${d.ms}ms`} note={d.use} duration={d.ms / 1000} ease={EASE_OUT} />
          ))}
          {EASINGS.map((e) => (
            <Track
              key={e.name}
              run={run}
              label={`${e.name}`}
              note={`${e.value} — ${e.use}`}
              duration={DURATION.slow * 1.6}
              ease={e.name === 'linear' ? 'linear' : e.name === 'ease-out-soft' ? EASE_OUT : [0.65, 0, 0.35, 1]}
            />
          ))}
        </ul>
      </Card>
      <Card title="Springs" usage="Rows and toasts use snappy, sheets use sheet, popovers use pop, the star uses bouncy.">
        <ul className="flex flex-col gap-3">
          {(Object.keys(SPRING) as (keyof typeof SPRING)[]).map((k) => (
            <Track key={k} run={run} label={`SPRING.${k}`} note={`stiffness ${SPRING[k].stiffness}, damping ${SPRING[k].damping}`} spring={SPRING[k]} />
          ))}
        </ul>
      </Card>
    </Section>
  )
}

function Track({
  run,
  label,
  note,
  duration,
  ease,
  spring,
}: {
  run: number
  label: string
  note: string
  duration?: number
  ease?: unknown
  spring?: (typeof SPRING)[keyof typeof SPRING]
}) {
  return (
    <li className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-[220px] shrink-0">
        <p className="font-mono text-[12.5px] font-semibold">{label}</p>
        <p className="text-[12px] text-muted">{note}</p>
      </div>
      <div className="relative h-8 flex-1 rounded-full bg-hover">
        <motion.span
          key={run}
          className="absolute top-1 left-1 size-6 rounded-full bg-inbox shadow-[0_1px_3px_rgb(16_24_40/0.3)]"
          initial={{ left: '4px' }}
          animate={{ left: 'calc(100% - 28px)' }}
          transition={spring ?? { duration, ease: ease as never }}
        />
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------------- components

function Buttons() {
  return (
    <Section id="buttons" title="Button" intro="Text buttons. One primary per surface; destructive only to confirm a delete.">
      <Card title="Variants" usage="primary for the main action, secondary for neutral, ghost in toolbars and Cancel, danger for a quiet first delete step, destructive for the confirm.">
        <Row>
          <Demo label="primary">
            <Button variant="primary">Save</Button>
          </Demo>
          <Demo label="secondary">
            <Button variant="secondary">Export JSON</Button>
          </Demo>
          <Demo label="ghost">
            <Button variant="ghost">Cancel</Button>
          </Demo>
          <Demo label="danger">
            <Button variant="danger">
              <Trash2 size={15} /> Delete
            </Button>
          </Demo>
          <Demo label="destructive">
            <Button variant="destructive">Delete task</Button>
          </Demo>
        </Row>
      </Card>
      <Card title="Sizes">
        <Row>
          <Demo label="md · 40px">
            <Button variant="primary">Medium</Button>
          </Demo>
          <Demo label="sm · 32px">
            <Button variant="primary" size="sm">
              Small
            </Button>
          </Demo>
        </Row>
      </Card>
      <Card title="States" usage="Hover, focus and pressed are simulated here; focus-visible shows a 2px blue ring offset 2px.">
        <Row>
          <Demo label="default">
            <Button variant="primary">Save</Button>
          </Demo>
          <Demo label="hover">
            <Force state="hover">
              <Button variant="primary">Save</Button>
            </Force>
          </Demo>
          <Demo label="focus-visible">
            <Force state="focus">
              <Button variant="primary">Save</Button>
            </Force>
          </Demo>
          <Demo label="pressed">
            <Force state="active">
              <Button variant="primary">Save</Button>
            </Force>
          </Demo>
          <Demo label="disabled">
            <Button variant="primary" disabled>
              Save
            </Button>
          </Demo>
          <Demo label="loading">
            <Button variant="secondary" loading>
              Import JSON
            </Button>
          </Demo>
        </Row>
      </Card>
    </Section>
  )
}

function IconButtons() {
  const [on, setOn] = useState(false)
  return (
    <Section id="icon-buttons" title="IconButton" intro="Square icon-only buttons. Always pass a label: it becomes the accessible name and tooltip. A hidden 40px hit area surrounds them.">
      <Card title="Variants, sizes and states">
        <Row>
          <Demo label="plain · md">
            <IconButton label="Add">
              <Plus size={18} />
            </IconButton>
          </Demo>
          <Demo label="plain · sm">
            <IconButton size="sm" label="Add">
              <Plus size={16} />
            </IconButton>
          </Demo>
          <Demo label="active (toggle)">
            <IconButton label="Calendar" active={on} onClick={() => setOn((o) => !o)} aria-pressed={on}>
              <CalendarDays size={18} />
            </IconButton>
          </Demo>
          <Demo label="hover">
            <Force state="hover">
              <IconButton label="Edit" className="bg-hover text-ink">
                <Pencil size={16} />
              </IconButton>
            </Force>
          </Demo>
          <Demo label="focus-visible">
            <Force state="focus">
              <IconButton label="Edit">
                <Pencil size={16} />
              </IconButton>
            </Force>
          </Demo>
          <Demo label="disabled">
            <IconButton label="Close" disabled className="disabled:opacity-40">
              <X size={18} />
            </IconButton>
          </Demo>
        </Row>
      </Card>
      <PhotoStage scene="dusk">
        <Row>
          <Demo label="glass (on the photo)" onPhoto>
            <IconButton variant="glass" label="Show sidebar" className="frost !size-9 !rounded-full">
              <Inbox size={18} />
            </IconButton>
          </Demo>
        </Row>
      </PhotoStage>
    </Section>
  )
}

function Chips() {
  return (
    <Section id="chips" title="IconChip" intro="Round gradient chips with a white glyph: the mark of every list. Decorative (aria-hidden); the label next to it carries the name.">
      <Card title="Tones">
        <Row>
          {TONES.map((t) => (
            <Demo key={t} label={t}>
              <IconChip icon={t === 'starred' ? Star : Inbox} tone={t} size={28} filled={t === 'starred'} />
            </Demo>
          ))}
        </Row>
      </Card>
      <Card title="Sizes">
        <Row>
          {[22, 26, 28, 32].map((s) => (
            <Demo key={s} label={`${s}px`}>
              <IconChip icon={CalendarDays} tone="today" size={s} />
            </Demo>
          ))}
        </Row>
      </Card>
    </Section>
  )
}

function Toggles() {
  const [a, setA] = useState(false)
  const [b, setB] = useState(true)
  const [s, setS] = useState(false)
  return (
    <Section id="toggles" title="Checkbox and StarButton">
      <Card title="Checkbox" usage="Round completion toggle (role=checkbox). The tick draws itself; the hit area is 40px. Sizes: 18 subtasks, 22 rows, 24 drawer.">
        <Row>
          <Demo label="unchecked (click me)">
            <Checkbox checked={a} onChange={() => setA(!a)} label="Example task" />
          </Demo>
          <Demo label="checked">
            <Checkbox checked={b} onChange={() => setB(!b)} label="Example task" />
          </Demo>
          <Demo label="focus-visible">
            <Force state="focus">
              <Checkbox checked={false} onChange={() => {}} label="Focused example" />
            </Force>
          </Demo>
          <Demo label="18px">
            <Checkbox size={18} checked onChange={() => {}} label="Small example" />
          </Demo>
          <Demo label="24px">
            <Checkbox size={24} checked={false} onChange={() => {}} label="Large example" />
          </Demo>
        </Row>
      </Card>
      <Card title="StarButton" usage="Pops with a spring when it turns on. quiet hides the empty star until the row is hovered.">
        <Row>
          <Demo label="off (click me)">
            <StarButton starred={s} onToggle={() => setS(!s)} label="example" />
          </Demo>
          <Demo label="on">
            <StarButton starred onToggle={() => {}} label="example" />
          </Demo>
          <Demo label="hover">
            <Force state="hover">
              <StarButton starred={false} onToggle={() => {}} className="bg-hover" label="example" />
            </Force>
          </Demo>
        </Row>
      </Card>
    </Section>
  )
}

function Fields() {
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  return (
    <Section id="fields" title="Fields" intro="Search in the sidebar; TextInput and TextArea on white panels. Pair invalid with a role=alert message.">
      <Card title="SearchField" usage="Escape clears and blurs; the × appears once there is text.">
        <div className="max-w-[260px]">
          <SearchField value={q} onChange={setQ} placeholder="Search tasks..." />
        </div>
      </Card>
      <Card title="TextInput">
        <div className="grid max-w-[640px] grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Default</span>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="List name" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Small</span>
            <TextInput size="sm" placeholder="New tag" />
          </label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sg-invalid" className="text-[13px] font-semibold text-muted">
              Error
            </label>
            <TextInput id="sg-invalid" invalid defaultValue="errands" aria-describedby="sg-invalid-msg" />
            <p id="sg-invalid-msg" className="text-[13px] text-danger-ink">
              “errands” already exists.
            </p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Disabled</span>
            <TextInput disabled defaultValue="Read only" />
          </label>
        </div>
      </Card>
      <Card title="TextArea" usage="Notes in the task drawer.">
        <label className="block max-w-[480px]">
          <span className="sr-only">Notes</span>
          <TextArea rows={3} placeholder="Add notes..." />
        </label>
      </Card>
    </Section>
  )
}

function Segmented() {
  const [v, setV] = useState<string | null>(null)
  const [p, setP] = useState<Priority>(2)
  return (
    <Section id="segmented" title="SegmentedControl" intro="A radiogroup with a sliding white thumb. The frosted version sits on the photo and clears when you click the active segment; solid sits on white.">
      <PhotoStage scene="dusk">
        <SegmentedControl
          label="Filter by date"
          value={v}
          onChange={setV}
          options={['Today', 'Tomorrow', 'Next 7 Days', 'Later', 'No Date'].map((l) => ({ id: l, label: l }))}
        />
      </PhotoStage>
      <Card title="solid, not clearable">
        <SegmentedControl
          variant="solid"
          clearable={false}
          label="Priority"
          value={p}
          onChange={(x) => x !== null && setP(x)}
          className="max-w-[300px]"
          options={(['None', 'Low', 'Medium', 'High'] as const).map((l, i) => ({ id: i as Priority, label: l }))}
        />
      </Card>
    </Section>
  )
}

function TagsFlags() {
  const [sel, setSel] = useState<string[]>(['errands'])
  const [done, setDone] = useState(1)
  return (
    <Section id="tags" title="TagChip, PriorityFlag, ProgressRing">
      <Card title="TagChip" usage="Tinted fill, coloured dot, ink text (AA on every tone). Static on rows, a toggle in the tag filter (aria-pressed), removable in the drawer.">
        <Row>
          {TONES.map((t) => (
            <Demo key={t} label={t}>
              <TagChip name={t} tone={t} />
            </Demo>
          ))}
        </Row>
        <div className="mt-5">
          <Row>
            {(['errands', 'deep-work'] as const).map((n, i) => (
              <Demo key={n} label={sel.includes(n) ? 'toggle · selected' : 'toggle'}>
                <TagChip
                  name={n}
                  tone={i ? 'upcoming' : 'teal'}
                  size="md"
                  selected={sel.includes(n)}
                  onClick={() => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))}
                />
              </Demo>
            ))}
            <Demo label="removable">
              <TagChip name="home" tone="green" onRemove={() => {}} />
            </Demo>
          </Row>
        </div>
      </Card>
      <Card title="PriorityFlag" usage="Shown on rows when priority is set. Colour plus an accessible name, never colour alone.">
        <Row>
          {([0, 1, 2, 3] as Priority[]).map((p) => (
            <Demo key={p} label={['none (showNone)', 'low', 'medium', 'high'][p]}>
              <PriorityFlag priority={p} showNone size={18} />
            </Demo>
          ))}
        </Row>
      </Card>
      <Card title="ProgressRing" usage="Subtask progress on a row. Turns green when everything is done.">
        <Row>
          <Demo label="empty">
            <ProgressRing done={0} total={3} />
          </Demo>
          <Demo label="interactive">
            <span className="flex items-center gap-3">
              <ProgressRing done={done} total={4} size={22} />
              <Stepper value={done} onChange={setDone} min={0} max={4} label="Done" />
            </span>
          </Demo>
          <Demo label="complete">
            <ProgressRing done={3} total={3} />
          </Demo>
          <Demo label="no label">
            <ProgressRing done={2} total={5} showLabel={false} />
          </Demo>
        </Row>
      </Card>
    </Section>
  )
}

function BadgesKeys() {
  const t = todayKey()
  return (
    <Section id="badges" title="DueBadge, Kbd, Spinner">
      <Card title="DueBadge" usage="Red overdue, amber today, purple tomorrow, muted later. Uses the text-safe hues.">
        <Row>
          <Demo label="overdue">
            <DueBadge due={addDays(t, -2)} />
          </Demo>
          <Demo label="today">
            <DueBadge due={t} />
          </Demo>
          <Demo label="tomorrow">
            <DueBadge due={addDays(t, 1)} />
          </Demo>
          <Demo label="this week">
            <DueBadge due={addDays(t, 4)} />
          </Demo>
          <Demo label="later">
            <DueBadge due={addDays(t, 30)} />
          </Demo>
          <Demo label="done">
            <DueBadge due={t} done />
          </Demo>
        </Row>
      </Card>
      <Card title="Kbd and Spinner">
        <Row>
          <Demo label="Kbd">
            <span className="flex gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </Demo>
          <Demo label="Spinner">
            <Spinner className="text-inbox" />
          </Demo>
        </Row>
      </Card>
    </Section>
  )
}

function Menus() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <Section id="menus" title="Menu and Popover" intro="Popover floats under (or above) its anchor, stays on screen, traps focus, and closes on Escape or an outside click, returning focus to the anchor.">
      <Card title="MenuItem states">
        <div className="max-w-[260px] rounded-[18px] p-2 shadow-[var(--shadow-pop)] ring-1 ring-black/5">
          <MenuLabel>Label</MenuLabel>
          <MenuItem icon={Pencil} label="Default" />
          <MenuItem icon={CalendarDays} iconClass="text-today" label="With hint" trailing="Fri" />
          <MenuItem icon={Inbox} iconClass="text-inbox" label="Selected" selected />
          <MenuItem icon={Plus} label="Disabled" disabled />
          <MenuSeparator />
          <MenuItem icon={Trash2} label="Danger" danger />
        </div>
      </Card>
      <Card title="Popover">
        <Button ref={ref} variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Open a popover
        </Button>
        <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref} align="start" width={240} label="Example popover">
          <MenuItem icon={Pencil} label="Rename" onClick={() => setOpen(false)} />
          <MenuItem icon={Trash2} label="Delete" danger onClick={() => setOpen(false)} />
        </Popover>
      </Card>
    </Section>
  )
}

function Pickers() {
  const [due, setDue] = useState<string | null>(todayKey())
  const [tone, setTone] = useState<Tone>('teal')
  const [n, setN] = useState(2)
  return (
    <Section id="pickers" title="Pickers">
      <Card title="DatePicker" usage="Quick picks plus a month grid. Lives in a Popover in the app.">
        <div className="w-[280px] rounded-[18px] p-2 shadow-[var(--shadow-pop)] ring-1 ring-black/5">
          <DatePicker value={due} onChange={setDue} />
        </div>
      </Card>
      <Card title="TonePicker and Stepper" usage="Colour for lists and tags; Stepper for custom repeat intervals.">
        <Row>
          <Demo label={`TonePicker · ${tone}`}>
            <TonePicker value={tone} onChange={setTone} />
          </Demo>
          <Demo label="Stepper">
            <Stepper value={n} onChange={setN} label="Interval" />
          </Demo>
        </Row>
      </Card>
    </Section>
  )
}

function Overlays() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])
  return (
    <Section id="overlays" title="Modal, Drawer, Toast" intro="Overlays share useOverlay: focus moves in, Tab is trapped, Escape closes only the top-most one, focus returns to the trigger.">
      <Card>
        <Row>
          <Demo label="Modal (command palette, dialogs)">
            <Button variant="secondary" onClick={() => setModal(true)}>
              Open modal
            </Button>
          </Demo>
          <Demo label="Drawer (task details, settings)">
            <Button variant="secondary" onClick={() => setDrawer(true)}>
              Open drawer
            </Button>
          </Demo>
          <Demo label="Toast">
            <span className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setToast({ key: Date.now(), message: 'Exported 3 tasks' })}>
                Plain
              </Button>
              <Button
                variant="secondary"
                onClick={() => setToast({ key: Date.now(), message: 'Completed Buy milk', action: { label: 'Undo', run: () => {} } })}
              >
                With action
              </Button>
              <Button variant="secondary" onClick={() => setToast({ key: Date.now(), message: 'That file is not valid JSON.', tone: 'error' })}>
                Error
              </Button>
            </span>
          </Demo>
        </Row>
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} label="Example dialog" width={420}>
        <div className="p-6">
          <h3 className="text-[18px] font-semibold">Example dialog</h3>
          <p className="mt-1.5 text-[14.5px] text-ink-2">Tab cycles inside. Escape or the scrim closes it.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModal(false)}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} label="Example drawer">
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="text-[20px] font-semibold">Example drawer</h3>
          <IconButton label="Close" onClick={() => setDrawer(false)}>
            <X size={18} />
          </IconButton>
        </div>
        <p className="px-5 pt-2 text-[14.5px] text-ink-2">Springs in from the right; full-width on phones.</p>
      </Drawer>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </Section>
  )
}

function OnPhoto() {
  const [scene, setScene] = useState<SceneId>('dusk')
  return (
    <Section id="photo" title="On the photo" intro="Photo-facing pieces use frost and text-photo so they read on every scene. Pick a scene to check them.">
      <SegmentedControl
        variant="solid"
        clearable={false}
        label="Scene"
        value={scene}
        onChange={(s) => s && setScene(s)}
        options={SCENES.map((s) => ({ id: s.id, label: s.name }))}
        className="max-w-[360px]"
      />
      <PhotoStage scene={scene}>
        <SectionLabel>No Date</SectionLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EmptyState title="Inbox zero" body="Nothing waiting here. Add a task above when something comes up." tone="inbox" />
          <EmptyState title="Done for today" body="You finished everything due today. Time to rest." tone="today" done />
        </div>
      </PhotoStage>
    </Section>
  )
}

function Scenes() {
  const [scene, setScene] = useState<SceneId>('dusk')
  return (
    <Section id="scenes" title="Scenes" intro="One SVG landscape, four palettes (stars and a moon at night, snowfall in winter). Scenery crossfades between them over --duration-scene.">
      <Card>
        <div className="flex flex-wrap gap-2">
          {SCENES.map((s) => (
            <Button key={s.id} size="sm" variant={s.id === scene ? 'primary' : 'secondary'} aria-pressed={s.id === scene} onClick={() => setScene(s.id)}>
              {s.name}
            </Button>
          ))}
        </div>
        <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-[16px]">
          <Scenery scene={scene} className="absolute inset-0" />
        </div>
      </Card>
    </Section>
  )
}

function Rows() {
  const t = todayKey()
  const tags: Tag[] = [
    { id: 'a', name: 'errands', tone: 'teal' },
    { id: 'b', name: 'home', tone: 'green' },
    { id: 'c', name: 'deep-work', tone: 'upcoming' },
  ]
  const [tasks, setTasks] = useState(() => [
    newTask('Plain task'),
    newTask('Starred, due today, high priority', { starred: true, due: t, priority: 3 }),
    newTask('With subtasks and tags', {
      tags: ['a', 'b', 'c'],
      subtasks: [
        { id: '1', title: 'One', done: true },
        { id: '2', title: 'Two', done: false },
        { id: '3', title: 'Three', done: false },
      ],
    }),
    newTask('Repeats weekly, due tomorrow', { repeat: { every: 1, unit: 'week' }, due: addDays(t, 1), priority: 1 }),
    newTask('Overdue', { due: addDays(t, -3), priority: 2 }),
    newTask('Completed', { done: true, completedAt: Date.now() }),
  ])
  return (
    <Section id="rows" title="Task rows" intro="The app's own TaskRow composed from the pieces above: Checkbox, title button, ProgressRing, TagChip, repeat icon, PriorityFlag, DueBadge, StarButton and a date Popover.">
      <PhotoStage scene="dusk">
        <DragProvider onDrop={() => {}}>
          <ul className="flex flex-col gap-[7px]">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskRow
                  task={task}
                  completing={false}
                  tags={tags}
                  onToggle={() =>
                    setTasks((ts) => ts.map((x) => (x.id === task.id ? { ...x, done: !x.done, completedAt: x.done ? null : Date.now() } : x)))
                  }
                  onStar={() => setTasks((ts) => ts.map((x) => (x.id === task.id ? { ...x, starred: !x.starred } : x)))}
                  onDue={(due) => setTasks((ts) => ts.map((x) => (x.id === task.id ? { ...x, due } : x)))}
                  onOpen={() => {}}
                />
              </li>
            ))}
          </ul>
        </DragProvider>
      </PhotoStage>
    </Section>
  )
}
