// The design tokens as data, for the style guide. Source of truth is
// src/styles.css (@theme); keep these in step when you change a token.

export type ColorToken = { name: string; value: string; use: string }

export const COLOR_GROUPS: { title: string; note: string; tokens: ColorToken[] }[] = [
  {
    title: 'Ink and surfaces',
    note: 'Text from strongest to quietest, then lines and fills for white panels. Muted passes AA on white, hover and active.',
    tokens: [
      { name: 'ink', value: '#1c1d21', use: 'Titles, task text' },
      { name: 'ink-2', value: '#3b3d44', use: 'Body, notes, icons on frost' },
      { name: 'muted', value: '#61656e', use: 'Labels, counts, meta' },
      { name: 'faint', value: '#b4b8c0', use: 'Placeholders, idle star (non-text)' },
      { name: 'line', value: '#e8e9ec', use: 'Dividers, field borders' },
      { name: 'line-strong', value: '#d9dbe0', use: 'Checkbox ring, keycaps' },
      { name: 'hover', value: '#f3f4f6', use: 'Hover fill' },
      { name: 'active', value: '#eff0f3', use: 'Selected fill' },
      { name: 'paper', value: '#ffffff', use: 'Sidebar, rows, sheets' },
    ],
  },
  {
    title: 'Smart List hues',
    note: 'Each Smart List owns a hue. The -2 shade is the top of the icon-chip gradient. For graphics and fills only.',
    tokens: [
      { name: 'inbox', value: '#1f7cf6', use: 'Inbox, focus rings, progress' },
      { name: 'inbox-2', value: '#4aa3ff', use: 'Chip gradient top' },
      { name: 'today', value: '#ff9500', use: 'Today, medium priority' },
      { name: 'today-2', value: '#ffb340', use: 'Chip gradient top' },
      { name: 'upcoming', value: '#b250e8', use: 'Upcoming, repeat' },
      { name: 'upcoming-2', value: '#cf7cf7', use: 'Chip gradient top' },
      { name: 'starred', value: '#ffc400', use: 'Stars' },
      { name: 'starred-2', value: '#ffd84d', use: 'Chip gradient top' },
      { name: 'danger', value: '#ef4444', use: 'High priority, delete fills' },
      { name: 'success', value: '#22b35e', use: 'Completed ring' },
    ],
  },
  {
    title: 'Text-safe hues',
    note: 'Darker versions that pass WCAG AA (4.5:1) on white, for coloured text like due dates and links.',
    tokens: [
      { name: 'inbox-ink', value: '#1767d6', use: 'Links, primary button' },
      { name: 'today-ink', value: '#b45309', use: 'Due today' },
      { name: 'upcoming-ink', value: '#8a3ab9', use: 'Due tomorrow' },
      { name: 'danger-ink', value: '#c81e1e', use: 'Overdue, errors, destructive' },
      { name: 'success-ink', value: '#15803d', use: 'All subtasks done' },
    ],
  },
  {
    title: 'List and tag tones',
    note: 'Extra tones for user lists and tags (plus the four Smart List hues).',
    tokens: [
      { name: 'teal', value: '#0fa3a3', use: 'List / tag tone' },
      { name: 'rose', value: '#f0436e', use: 'List / tag tone' },
      { name: 'green', value: '#2fb455', use: 'List / tag tone, Completed' },
      { name: 'slate', value: '#64718a', use: 'List / tag tone, Search' },
    ],
  },
]

export const TYPE_SCALE: { size: number; weight: number; leading: string; sample: string; use: string }[] = [
  { size: 30, weight: 600, leading: '1', sample: 'Inbox', use: 'View title on the photo (text-photo)' },
  { size: 22, weight: 600, leading: '1.3', sample: 'Present the Halcyon routes', use: 'Task title in the drawer' },
  { size: 20, weight: 600, leading: '1.3', sample: 'Settings', use: 'Sheet title' },
  { size: 17, weight: 600, leading: '1.4', sample: 'Inbox zero', use: 'Empty state title, palette input (400)' },
  { size: 16, weight: 400, leading: '1.35', sample: 'Set a due date on this task', use: 'Task rows, sidebar items, add bar' },
  { size: 15, weight: 400, leading: '1.55', sample: 'Search tasks…', use: 'Search, notes, fields' },
  { size: 14, weight: 500, leading: '1.45', sample: 'Smart Lists', use: 'Sidebar headings, menu items, field labels' },
  { size: 13, weight: 600, leading: '1.4', sample: 'No Date', use: 'Group labels over the photo, small buttons' },
  { size: 12.5, weight: 600, leading: '1.3', sample: 'Tomorrow · 2/5', use: 'Row meta: due badge, list, progress' },
  { size: 12, weight: 600, leading: '1.3', sample: 'errands', use: 'Tag chips, menu hints, keycaps' },
  { size: 11, weight: 600, leading: '1.2', sample: 'M T W T F S S', use: 'Calendar weekdays' },
]

export const SPACING = [2, 4, 6, 8, 10, 12, 13, 16, 18, 20, 22, 24, 37]

export const RADII: { name: string; value: string; use: string }[] = [
  { name: 'radius-field', value: '12px', use: 'Search and text fields' },
  { name: 'radius-item', value: '12px', use: 'Sidebar items' },
  { name: '10px', value: '10px', use: 'Buttons, menu items, icon buttons' },
  { name: '16px', value: '16px', use: 'Field groups in sheets' },
  { name: 'radius-panel', value: '18px', use: 'Popovers, sidebar corner' },
  { name: '22px', value: '22px', use: 'Drawer, modal' },
  { name: 'full', value: '9999px', use: 'Task rows, add bar, chips, toasts' },
]

export const SHADOWS: { name: string; value: string; use: string }[] = [
  { name: 'shadow-row', value: 'var(--shadow-row)', use: 'Task rows' },
  { name: 'shadow-pop', value: 'var(--shadow-pop)', use: 'Popovers, toasts, drag ghost' },
  { name: 'shadow-panel', value: 'var(--shadow-panel)', use: 'Drawer, modal, mobile sidebar' },
]

export const DURATIONS: { name: string; ms: number; use: string }[] = [
  { name: 'duration-fast', ms: 150, use: 'Hover fills, presses' },
  { name: 'duration-base', ms: 220, use: 'Small state changes, list items' },
  { name: 'duration-slow', ms: 450, use: 'Entrances (header, add bar)' },
  { name: 'duration-scene', ms: 900, use: 'Background crossfade' },
]

export const EASINGS: { name: string; value: string; use: string }[] = [
  { name: 'ease-out-soft', value: 'cubic-bezier(0.22, 1, 0.36, 1)', use: 'Entrances' },
  { name: 'ease-in-out-sweep', value: 'cubic-bezier(0.65, 0, 0.35, 1)', use: 'Tick draw, strike-through' },
  { name: 'linear', value: 'linear', use: 'Spinner, snowfall' },
]
