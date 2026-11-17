import { useEffect, useRef, type RefObject } from 'react'

/*
  Shared behaviour for anything that floats over the app (drawers, modals,
  popovers): Escape closes only the top-most overlay, Tab is trapped inside it,
  focus moves in on open and goes back to where it came from on close. A
  trigger that may be re-created while the overlay is open can carry
  `data-focus-key` so focus finds its replacement.
*/

const stack: symbol[] = []

/** True while any overlay is open (global shortcuts stand down). */
export const isOverlayOpen = () => stack.length > 0

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0,
  )
}

type Options = {
  open: boolean
  onClose: () => void
  /** Keep Tab inside the overlay and move focus into it on open. */
  trap?: boolean
}

export function useOverlay(ref: RefObject<HTMLElement | null>, { open, onClose, trap = true }: Options) {
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    const id = Symbol('overlay')
    stack.push(id)
    const previous = document.activeElement as HTMLElement | null
    // If the trigger re-renders elsewhere (a row moving groups), find it again by key.
    const previousKey = previous?.dataset.focusKey

    let tries = 0
    const focusIn = () => {
      const root = ref.current
      if (!root) {
        if (tries++ < 5) raf = requestAnimationFrame(focusIn)
        return
      }
      if (!trap || root.contains(document.activeElement)) return
      const target = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(root)[0] ?? root
      target.focus({ preventScroll: true })
    }
    let raf = requestAnimationFrame(focusIn)

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close.current()
        return
      }
      const root = ref.current
      if (!trap || e.key !== 'Tab' || !root) return
      const items = focusables(root)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!root.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey, true)
      stack.splice(stack.indexOf(id), 1)
      const active = document.activeElement
      const focusWasInside = !active || active === document.body || ref.current?.contains(active)
      if (!focusWasInside || !previous) return
      const target = previous.isConnected
        ? previous
        : previousKey
          ? document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(previousKey)}"]`)
          : null
      target?.focus({ preventScroll: true })
    }
  }, [open, trap, ref])
}
