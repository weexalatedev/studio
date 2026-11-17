import type { Tone } from '../data'

/** Gradient pairs for each tone: [top, bottom]. */
export const TONES: Record<Tone, [string, string]> = {
  inbox: ['var(--color-inbox-2)', 'var(--color-inbox)'],
  today: ['var(--color-today-2)', 'var(--color-today)'],
  upcoming: ['var(--color-upcoming-2)', 'var(--color-upcoming)'],
  starred: ['var(--color-starred-2)', 'var(--color-starred)'],
  teal: ['#3fd0c9', '#0fa3a3'],
  rose: ['#ff7a9c', '#f0436e'],
  green: ['#6fd884', '#2fb455'],
  slate: ['#9aa6b8', '#64718a'],
}

export const toneSolid = (tone: Tone) => TONES[tone][1]

/** A light wash of the tone for chip backgrounds (`pct` of the colour over white). */
export const toneTint = (tone: Tone, pct = 14) => `color-mix(in srgb, ${toneSolid(tone)} ${pct}%, white)`
