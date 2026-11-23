import { Download, MonitorSmartphone, Palette, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Button } from '../components/Button'
import { Drawer } from '../components/Drawer'
import { IconButton } from '../components/IconButton'
import { Kbd } from '../components/Kbd'
import { Popover } from '../components/Popover'
import { Select } from '../components/Select'
import { TextInput } from '../components/TextField'
import { TonePicker } from '../components/TonePicker'
import { toneSolid, toneTint } from '../components/tones'
import { COPY, CURRENCIES, type Currency, type SceneId } from '../data'
import { Field } from './agencyUi'
import { downloadExport, MAX_IMPORT_BYTES, parseImport } from '../lib/io'
import { Link } from '../router'
import { CloudSync } from './CloudSync'
import { ScenePicker } from './ScenePicker'
import type { Actions, State, Tag } from './store'

type Props = {
  open: boolean
  onClose: () => void
  state: State
  actions: Actions
  onScene: (s: SceneId) => void
  /** Show a toast; `undo` restores the previous state. */
  onNotice: (message: string, undo?: () => void) => void
}

const SHORTCUTS: [string[], string][] = [
  [['⌘', 'K'], 'Command palette'],
  [['N'], 'New task'],
  [['/'], 'Search'],
  [['['], 'Show or hide the sidebar'],
  [['Space'], 'Complete the focused task'],
  [['Alt', '↑'], 'Move the focused task up'],
  [['Esc'], 'Close'],
]

/** Settings: background, tags, import/export and shortcuts. */
export function SettingsSheet({ open, onClose, state, actions, onScene, onNotice }: Props) {
  return (
    <Drawer open={open} onClose={onClose} label="Settings">
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="text-[20px] font-semibold text-ink">Settings</h2>
        <IconButton label="Close settings" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <Section title="Studio" note="Shown in the sidebar and used for every money figure.">
          <StudioSettings state={state} actions={actions} />
        </Section>
        <Section title="Background">
          <ScenePicker value={state.prefs.scene} onChange={onScene} />
        </Section>
        <Section title="Tags" note="Add tags here, in a task, or by typing #tag in the add bar.">
          <TagManager tags={state.tags} actions={actions} />
        </Section>
        <Section title="Data" note={COPY.importHelp}>
          <DataTools state={state} actions={actions} onNotice={onNotice} />
        </Section>
        <Section title="Cloud sync" note="Optional: keep one workspace across devices with your own database.">
          <CloudSync state={state} actions={actions} onNotice={onNotice} />
        </Section>
        <Section title="Install" note="Studio is a PWA: install it for a standalone window and offline use.">
          <InstallCard />
        </Section>
        <Section title="Keyboard">
          <ul className="divide-y divide-line rounded-[16px] border border-line">
            {SHORTCUTS.map(([keys, what]) => (
              <li key={what} className="flex min-h-[42px] items-center justify-between gap-3 px-4 text-[14px] text-ink-2">
                {what}
                <span className="flex gap-1">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Section>
        <Link
          to="/styleguide"
          className="mt-6 inline-flex items-center gap-1.5 rounded-[8px] text-[14px] font-semibold text-inbox-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inbox"
        >
          <Palette size={15} aria-hidden /> Open the style guide
        </Link>
      </div>
    </Drawer>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      {note && <p className="mt-0.5 text-[13px] leading-snug text-muted">{note}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  )
}

function TagManager({ tags, actions }: { tags: Tag[]; actions: Actions }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = () => {
    const name = draft.trim().replace(/^#/, '')
    if (!name) return setError('Type a name first.')
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) return setError(`“${name}” already exists.`)
    actions.addTag(name, tags.length)
    setDraft('')
    setError(null)
  }

  return (
    <div>
      {tags.length > 0 ? (
        <ul className="divide-y divide-line rounded-[16px] border border-line">
          {tags.map((t) => (
            <TagRow key={t.id} tag={t} actions={actions} />
          ))}
        </ul>
      ) : (
        <p className="rounded-[16px] border border-dashed border-line-strong px-4 py-3 text-[14px] text-muted">No tags yet.</p>
      )}
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <TextInput
          size="sm"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          placeholder="New tag"
          aria-label="New tag name"
          aria-describedby={error ? 'tag-error' : undefined}
          invalid={!!error}
          maxLength={24}
        />
        <Button type="submit" size="sm" variant="secondary" className="!h-9 shrink-0">
          Add tag
        </Button>
      </form>
      {error && (
        <p id="tag-error" role="alert" className="mt-1.5 text-[13px] text-danger-ink">
          {error}
        </p>
      )}
    </div>
  )
}

function TagRow({ tag, actions }: { tag: Tag; actions: Actions }) {
  const [name, setName] = useState(tag.name)
  const [picking, setPicking] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <li className="flex min-h-[48px] items-center gap-2 pr-2 pl-3">
      <button
        ref={ref}
        type="button"
        aria-label={`Colour of ${tag.name}`}
        aria-expanded={picking}
        onClick={() => setPicking((p) => !p)}
        className="hit-40 grid size-9 shrink-0 place-items-center rounded-[10px] hover:bg-hover focus-visible:outline-2 focus-visible:outline-inbox"
      >
        <span className="size-4 rounded-full ring-4" style={{ background: toneSolid(tag.tone), ['--tw-ring-color' as string]: toneTint(tag.tone, 24) }} />
      </button>
      <Popover open={picking} onClose={() => setPicking(false)} anchorRef={ref} align="start" width={300} label={`Colour of ${tag.name}`}>
        <TonePicker value={tag.tone} onChange={(tone) => actions.updateTag(tag.id, { tone })} />
      </Popover>
      <input
        value={name}
        aria-label={`Rename tag ${tag.name}`}
        maxLength={24}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const n = name.trim()
          if (n && n !== tag.name) actions.updateTag(tag.id, { name: n })
          else setName(tag.name)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-9 min-w-0 flex-1 rounded-[8px] bg-transparent px-1.5 text-[14.5px] text-ink outline-none focus-visible:bg-hover"
      />
      <IconButton label={`Delete tag ${tag.name}`} onClick={() => actions.removeTag(tag.id)}>
        <Trash2 size={16} />
      </IconButton>
    </li>
  )
}

function DataTools({ state, actions, onNotice }: { state: State; actions: Actions; onNotice: Props['onNotice'] }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setImporting(true)
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('That file is larger than 5 MB.')
      const next = parseImport(await file.text())
      const before = state
      actions.replace(next)
      onNotice(`Imported ${next.tasks.length} ${next.tasks.length === 1 ? 'task' : 'tasks'}`, () => actions.replace(before))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            downloadExport(state)
            onNotice(`Exported ${state.tasks.length} ${state.tasks.length === 1 ? 'task' : 'tasks'}`)
          }}
        >
          <Download size={16} /> Export JSON
        </Button>
        <Button variant="secondary" loading={importing} onClick={() => fileRef.current?.click()} aria-describedby={error ? 'import-error' : undefined}>
          <Upload size={16} /> Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a Studio JSON export"
          data-testid="import-file"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p id="import-error" role="alert" className="mt-2 rounded-[12px] bg-danger/8 px-3 py-2 text-[13.5px] text-danger-ink">
          {error}
        </p>
      )}
      <div className="mt-3">
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-hover px-3 py-2">
            <span className="mr-auto text-[13.5px] text-ink-2">Replace everything with the sample tasks?</span>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                const before = state
                actions.reset()
                setConfirmReset(false)
                onNotice('Sample data restored', () => actions.replace(before))
              }}
            >
              Reset
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Reset to sample data
          </Button>
        )}
      </div>
    </div>
  )
}

function StudioSettings({ state, actions }: { state: State; actions: Actions }) {
  const [name, setName] = useState(state.prefs.agencyName)
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Studio name">
          <TextInput
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const next = name.trim()
              if (next && next !== state.prefs.agencyName) actions.setPrefs({ agencyName: next })
              else setName(state.prefs.agencyName)
            }}
          />
        </Field>
      </div>
      <Field label="Currency">
        <Select
          label="Currency"
          value={state.prefs.currency}
          onChange={(e) => actions.setPrefs({ currency: e.target.value as Currency })}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </Field>
      <Field label="Default hourly rate" hint="Used when a project has no rate.">
        <TextInput
          type="number"
          min={0}
          step={5}
          value={String(state.prefs.defaultRate)}
          onChange={(e) => actions.setPrefs({ defaultRate: Math.max(0, Number(e.target.value) || 0) })}
        />
      </Field>
    </div>
  )
}

type InstallEvent = Event & { prompt: () => Promise<void> }

function InstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as InstallEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <p className="inline-flex items-center gap-2 rounded-[14px] bg-success/10 px-3 py-2 text-[13.5px] font-semibold text-success-ink">
        <MonitorSmartphone size={16} /> Installed — running as an app.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {promptEvent ? (
        <Button
          variant="primary"
          className="self-start"
          onClick={async () => {
            await promptEvent.prompt()
            setPromptEvent(null)
            setNote('If the prompt was dismissed, use your browser menu → Install app.')
          }}
        >
          <MonitorSmartphone size={16} /> Install Studio
        </Button>
      ) : (
        <p className="rounded-[14px] bg-hover px-3 py-2 text-[13.5px] leading-relaxed text-ink-2">
          <strong className="font-semibold">iPhone / iPad:</strong> Share → Add to Home Screen.{' '}
          <strong className="font-semibold">Desktop:</strong> the install icon in the address bar, or your browser menu → Install.
        </p>
      )}
      {note && <p className="text-[12.5px] text-muted">{note}</p>}
      <p className="text-[12px] text-muted">Installed once, it opens offline and keeps your data on this device.</p>
    </div>
  )
}
