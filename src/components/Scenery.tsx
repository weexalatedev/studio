import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'

import { SCENES, type SceneId } from '../data'
import { DURATION } from '../lib/motion'
import { Landscape } from './Landscape'

type Props = {
  scene: SceneId
  /** A photo path replaces the illustrated scenes entirely. */
  photo?: string | null
  className?: string
}

/**
 * The full-bleed background. Changing `scene` crossfades: the new scene fades
 * in on top of the old one, which stays solid underneath until it is covered.
 */
export function Scenery({ scene, photo, className = '' }: Props) {
  const layer = useRef(0)
  const z = useRef(new Map<SceneId, number>())
  if (!z.current.has(scene)) z.current.set(scene, ++layer.current)

  // Tint the page and the browser chrome to match.
  useEffect(() => {
    const base = SCENES.find((s) => s.id === scene)?.base
    if (!base) return
    document.body.style.background = base
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', base)
  }, [scene])

  if (photo) return <img src={photo} alt="" className={`size-full object-cover ${className}`} />

  return (
    <div className={`isolate overflow-hidden ${className.includes('absolute') || className.includes('fixed') ? '' : 'relative'} ${className}`}>
      <AnimatePresence initial={false} onExitComplete={() => z.current.clear()}>
        <motion.div
          key={scene}
          className="absolute inset-0"
          style={{ zIndex: z.current.get(scene) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1, transition: { duration: DURATION.scene } }}
          transition={{ duration: DURATION.scene, ease: 'easeInOut' }}
        >
          <Landscape scene={scene} className="size-full" />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
