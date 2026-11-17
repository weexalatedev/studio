// Motion tokens for `motion` animations. CSS mirrors live in src/styles.css
// (--ease-*, --duration-*). Keep the two in step.

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_SWEEP = [0.65, 0, 0.35, 1] as const

export const DURATION = { fast: 0.15, base: 0.22, slow: 0.45, scene: 0.9 } as const

export const SPRING = {
  /** Rows, toasts: quick with a little settle. */
  snappy: { type: 'spring', stiffness: 420, damping: 32 },
  /** Drawers and sheets. */
  sheet: { type: 'spring', stiffness: 380, damping: 38 },
  /** Popovers and menus. */
  pop: { type: 'spring', stiffness: 480, damping: 32 },
  /** The star and other playful toggles. */
  bouncy: { type: 'spring', stiffness: 520, damping: 14 },
} as const
