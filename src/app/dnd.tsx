import { motion } from 'motion/react'
import { createContext, useCallback, useContext, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import type { Task, View } from './store'

/*
  Pointer-based drag and drop for task rows. Mouse drags start after 6px of
  movement; touch drags start after a 350ms long-press (so normal scrolling
  still works). Rows mark themselves with `data-drop-row`, sidebar entries with
  `data-drop-view`; anything inside `data-no-drag` (checkbox, star, buttons)
  never starts a drag. Escape cancels.
*/

export type DropTarget = { kind: 'row'; id: string; place: 'before' | 'after' } | { kind: 'view'; view: View }

type Drag = {
  task: Task
  x: number
  y: number
  dx: number
  dy: number
  w: number
  target: DropTarget | null
}

type Ctx = {
  drag: Drag | null
  onPointerDown: (e: ReactPointerEvent<HTMLElement>, task: Task) => void
}

const DragContext = createContext<Ctx>({ drag: null, onPointerDown: () => {} })

export const useDrag = () => useContext(DragContext)

export const viewKey = (v: View) => ('id' in v ? `${v.kind}:${v.id}` : v.kind)

function hitTest(x: number, y: number, selfId: string): DropTarget | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  const viewEl = el?.closest<HTMLElement>('[data-drop-view]')
  if (viewEl) {
    const [kind, id] = viewEl.dataset.dropView!.split(':')
    return { kind: 'view', view: { kind, id } as View }
  }
  const rowEl = el?.closest<HTMLElement>('[data-drop-row]')
  if (rowEl && rowEl.dataset.dropRow !== selfId) {
    const r = rowEl.getBoundingClientRect()
    return { kind: 'row', id: rowEl.dataset.dropRow!, place: y < r.top + r.height / 2 ? 'before' : 'after' }
  }
  return null
}

function autoScroll(y: number) {
  const box = document.querySelector<HTMLElement>('[data-drag-scroll]')
  if (!box) return
  const r = box.getBoundingClientRect()
  if (y < r.top + 56) box.scrollBy(0, -12)
  else if (y > r.bottom - 56) box.scrollBy(0, 12)
}

export function DragProvider({ onDrop, children }: { onDrop: (task: Task, target: DropTarget) => void; children: ReactNode }) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const current = useRef<Drag | null>(null)
  const dropRef = useRef(onDrop)
  dropRef.current = onDrop

  const set = (d: Drag | null) => {
    current.current = d
    setDrag(d)
  }

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>, task: Task) => {
    if (e.button !== 0 || task.done || (e.target as HTMLElement).closest('[data-no-drag]')) return
    const el = e.currentTarget
    const startX = e.clientX
    const startY = e.clientY
    const touch = e.pointerType !== 'mouse'
    let started = false
    let timer = 0

    const start = (x: number, y: number) => {
      started = true
      const r = el.getBoundingClientRect()
      set({ task, x, y, dx: startX - r.left, dy: startY - r.top, w: r.width, target: null })
      document.documentElement.style.userSelect = 'none'
      document.documentElement.style.cursor = 'grabbing'
      if (touch) navigator.vibrate?.(8)
    }

    const move = (ev: PointerEvent) => {
      if (!started) {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY)
        if (touch) {
          if (dist > 8) cleanup()
          return
        }
        if (dist < 6) return
        start(ev.clientX, ev.clientY)
      }
      ev.preventDefault()
      autoScroll(ev.clientY)
      const prev = current.current!
      set({ ...prev, x: ev.clientX, y: ev.clientY, target: hitTest(ev.clientX, ev.clientY, task.id) })
    }
    const blockTouch = (ev: TouchEvent) => {
      if (started) ev.preventDefault()
    }
    const blockMenu = (ev: Event) => {
      if (started || touch) ev.preventDefault()
    }
    const up = () => {
      const d = current.current
      const wasStarted = started
      cleanup()
      if (!wasStarted || !d) return
      // Swallow the click that follows a drag so the row does not open.
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation()
        ev.preventDefault()
      }
      window.addEventListener('click', swallow, { capture: true, once: true })
      window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 50)
      if (d.target) dropRef.current(d.task, d.target)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && started) {
        ev.preventDefault()
        ev.stopPropagation()
        cleanup()
      }
    }
    function cleanup() {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cleanup)
      window.removeEventListener('touchmove', blockTouch)
      window.removeEventListener('contextmenu', blockMenu)
      window.removeEventListener('keydown', onKey, true)
      document.documentElement.style.userSelect = ''
      document.documentElement.style.cursor = ''
      if (started) set(null)
      started = false
    }

    if (touch) timer = window.setTimeout(() => start(startX, startY), 350)
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cleanup)
    window.addEventListener('touchmove', blockTouch, { passive: false })
    window.addEventListener('contextmenu', blockMenu)
    window.addEventListener('keydown', onKey, true)
  }, [])

  const overView = drag?.target?.kind === 'view'

  return (
    <DragContext.Provider value={{ drag, onPointerDown }}>
      {children}
      {drag &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden>
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: overView ? 0.62 : 1.02, rotate: overView ? 0 : 1.2, opacity: overView ? 0.92 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              className="absolute flex h-[45px] items-center gap-3 rounded-full bg-white pr-4 pl-[15px] shadow-[var(--shadow-pop)]"
              style={{
                left: drag.x - drag.dx,
                top: drag.y - drag.dy,
                width: drag.w,
                transformOrigin: `${drag.dx}px ${drag.dy}px`,
              }}
            >
              <span className="size-[22px] shrink-0 rounded-full border-[1.5px] border-line-strong" />
              <span className="truncate text-[16px] text-ink">{drag.task.title}</span>
            </motion.div>
          </div>,
          document.body,
        )}
    </DragContext.Provider>
  )
}
