# Studio

A calm operations workspace for a creative and software studio, over a
full-bleed landscape: clients, projects, tasks, team capacity and billable
time, with a white sidebar and frosted panels.

It runs entirely in the browser (`localStorage`) and installs as a PWA, so it
works offline with no sign-in. An **optional** Postgres sync endpoint lets a
small team share one workspace across devices.

## What is in it

**Overview** — open tasks, overdue count, pipeline value and weekly utilisation;
the tasks that need attention next; projects in flight with progress; this
week's hours as a bar chart; team load against capacity; upcoming deadlines;
active clients and retainers.

**Clients** — cards and a detail page per account: status (active, lead,
paused, archived), contact and email, monthly retainer, notes, colour, every
project and every task, plus logged hours. Create, edit and delete inline.

**Projects** — a filterable pipeline (lead → discovery → design → build →
review → launched), each card showing client, health (on track / at risk /
overdue), deadline, progress and budget. The project page has progress, logged
vs estimated hours, budget burn, an editable rate, notes, a task list and a
**board** (To do, In progress, In review, Done) with move controls.

**Tasks** — everything the to-do app had: smart lists (Inbox, Today, Upcoming,
Starred, Completed), your own lists with icons and colours, due dates, repeats,
priorities, starred, tags, subtasks, notes, search, date and tag filters,
drag-to-reorder and drop-on-list, and ⌘K for every action. Tasks now also carry
a **project, assignee, board status, estimate, billable flag and time log**.

**Team** — people, roles, hourly rates, weekly capacity and live load, with
over-capacity warnings and the projects each person is on.

**Timesheet** — log hours by person, project, date and note; billable or not;
per-person weekly load; entries grouped by day; all-time totals and billable
value priced at each project's rate.

Menus everywhere: Settings also holds the studio name, currency, default rate,
tags, JSON import/export, cloud sync, install prompt and shortcuts.

## Voice control

The mic button (bottom right, or **Ctrl/⌘ + Shift + V**, or ⌘K → "Voice
command") takes a spoken command and runs it against the live workspace, so the
whole CRM can be driven by voice alone: navigation, tasks, clients, projects,
team and time entries.

```text
open timesheet                     show client Meridian
add task Review Q4 invoices         complete QA smoke test
move Accessibility pass to in review     assign … to Dev
new client Northwind               new project Brand refresh for Halcyon
set budget for Patient portal to 64000   set retainer for Halcyon to 4500
delete project Kestrel onboarding    log 2 hours to Patient portal by Sam
```

Speech recognition uses the browser's Web Speech API (Chrome, Edge, Safari);
where it is missing the app still accepts commands from an agent. Any agent —
an in-page script, an iframe, or a desktop voice assistant driving the page —
can call the same dispatcher:

```js
window.studioVoice.runCommand('log 45 minutes to Design system audit by Ana')
window.studioVoice.start()   // begin listening
window.studioVoice.stop()

// or from an embedding shell
iframe.contentWindow.postMessage({ type: 'studio:command', text: 'open projects' }, '*')
```

`runCommand` is the single entry point for every action, so an external agent
that transcribes audio itself (Whisper, Deepgram, a native assistant) only has
to pass the final sentence here. Commands that remove or finish something offer
Undo; say or send `undo` to reverse the last one.

## Run it

```sh
npm install            # bun also works: bun install
npm run dev            # http://localhost:5173 (Vite + the Worker in workerd)
npm run typecheck
npm run build          # dist/client (assets) + dist/tasks/index.js (Worker)
```

`npm run icons` regenerates the PWA icons in `public/icons/`.

## Deploy to Vercel

`vite.config.ts` detects `VERCEL=1` and skips the Cloudflare plugin, so Vercel
gets a plain static build plus the Node functions in `api/`.

- `vercel.json` sets `npx vite build`, `outputDirectory: dist`, the SPA
  rewrite (everything except `/api/*` → `index.html`) and cache headers.
- `api/health.ts` mirrors the Worker's health check.
- `api/sync.ts` is the optional sync endpoint (returns 501 without a database).

Push the repo, import it in Vercel, deploy — no other configuration is needed
for the local-first app.

## Database: use Neon (free)

For a small studio the best free option is **Neon** (serverless Postgres):
100 projects, 1 GB storage and 100 compute-hours per project each month, no
card, scales to zero after 5 minutes idle, and 10 branches for staging. Brains
apart from Supabase's free tier, which pauses projects after a week of
inactivity and caps you at two projects, and Prisma Postgres, which meters
operations. Nothing here needs Redis, auth or a vector store.

1. Create a free project at <https://neon.com> and copy the **pooled**
   connection string.
2. Run the schema: `psql "$DATABASE_URL" -f db/schema.sql` (or paste
   `db/schema.sql` into the Neon SQL editor).
3. In Vercel → Settings → Environment Variables add `DATABASE_URL`.
4. Open Studio → Settings → Cloud sync, type a long random token, then
   **Push this device**. Use the same token on another device with **Pull from
   cloud**.

The token is sent in an `x-sync-token` header and only its SHA-256 hash is
stored, so a database leak does not expose it. Sync is last-write-wins: pull
before editing on a second device, push when you finish. There is no auth
service — the token *is* the credential, so keep it long and private.

### Optional: real accounts with Clerk (free)

For per-user workspaces, add Clerk (free up to 10k
monthly active users):

1. Create a free app at <https://clerk.com> and copy the publishable key.
2. In Vercel → Settings → Environment Variables add
   `VITE_CLERK_PUBLISHABLE_KEY` (frontend) and `CLERK_SECRET_KEY` (backend).
3. Redeploy. Studio now requires sign-in; each signed-in user gets their
   own workspace in the same Neon database, keyed by their Clerk user id.

Clerk is required for the app to run — without `VITE_CLERK_PUBLISHABLE_KEY`
Studio shows a configuration screen instead of the dashboard.

`api/sync.ts` verifies the Clerk session JWT with `@clerk/backend` when
`CLERK_SECRET_KEY` is set.

## How it fits together

- `src/data.ts` — app name, every string, smart lists, statuses, currencies and
  the starter workspace (three clients, six projects, four people, eight tasks,
  time entries). Start there.
- `src/app/store.ts` — the data layer: task, list, tag, client, project, member
  and time-entry types; the reducer; `localStorage` key `studio:v3` (migrating
  `tasky:v2` and `tasky:v1`); `normalizeState` validation for saved data and
  imports; and what each view shows.
- `src/lib/agency.ts` — derived numbers: project budgets and burn, client
  health, team load, pipeline and utilisation.
- `src/lib/format.ts` — money, hours and week helpers.
- `src/app/OverviewView.tsx`, `ClientsView.tsx`, `ProjectsView.tsx`,
  `TeamView.tsx`, `TimeView.tsx`, `agencyUi.tsx` — the studio screens and their
  shared panels, avatars, pills and progress bars.
- `src/app/*` — the task screens: `Sidebar`, `AddTaskBar`, `TaskView`,
  `TaskRow`, `TaskDrawer` (project, assignee, board status, estimate, billable,
  time log), `CommandPalette`, `SettingsSheet`, `dnd.tsx`.
- `src/components/` — the design system, all shown at **`/styleguide`**.
- `src/worker/index.ts` — the Cloudflare Worker that serves the app and
  `/api/health`.
- `api/` — Vercel functions (`health`, optional `sync`).
- `public/sw.js`, `public/manifest.webmanifest`, `public/icons/` — the PWA.

### Tokens

| Token | Use |
| --- | --- |
| `--color-ink`, `ink-2`, `muted`, `faint` | Text, strongest to quietest |
| `--color-line`, `line-strong`, `hover`, `active` | Borders and item states |
| `--color-inbox` / `today` / `upcoming` / `starred` (+ `-2`) | Smart-list and status hues |
| `--color-teal`, `rose`, `green`, `slate` | Client, project and tag tones |
| `--radius-field`, `radius-item`, `radius-panel` | Inputs, items, panels |
| `--duration-*`, `--ease-*` | Motion tokens (mirrored in `src/lib/motion.ts`) |
| `--shadow-row`, `shadow-pop`, `shadow-panel` | Rows, popovers, drawers |
| `frost`, `text-photo`, `hit-40` | Glass panels, labels on the photo, 40px touch targets |

## PWA

- `public/manifest.webmanifest`: standalone display, gradient icons including a
  maskable one, brand colours.
- `public/sw.js`: precached shell, network-first navigations with an offline
  fallback, stale-while-revalidate for hashed assets and fonts, and `/api/*`
  never cached.
- The service worker registers only in production (`import.meta.env.PROD`), so
  dev keeps hot reload. Test offline with `npm run build && npm run preview`.

## Also deployable to Cloudflare

`deploy.json` and `wrangler.jsonc` are unchanged: `npm run build` still emits a
Worker plus assets for Freebuff Sites / Cloudflare, and the Hono Worker keeps
serving `GET /api/health` (405 for other methods there, JSON 404 for unknown
`/api/*`).
