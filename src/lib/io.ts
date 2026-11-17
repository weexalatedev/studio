// JSON export and import for the settings sheet. The file is the State plus a
// small header, so it round-trips and older exports still load.

import { APP_NAME } from '../data'
import { normalizeState, type State } from '../app/store'
import { todayKey } from './dates'

export const EXPORT_FORMAT = 'studio-export'
// Older `tasky-export` files still import: normalizeState does the validation.
export const EXPORT_VERSION = 2

export function exportJson(state: State): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), ...state }, null, 2)
}

/** Start a download of the current data as `studio-YYYY-MM-DD.json`. */
export function downloadExport(state: State) {
  const blob = new Blob([exportJson(state)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${APP_NAME.toLowerCase()}-${todayKey()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Parse an export. Throws an Error with a readable message when the file is not usable. */
export function parseImport(text: string): State {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  return normalizeState(raw)
}

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024
