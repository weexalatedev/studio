import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { usePath } from './router'
import './styles.css'

const StyleGuide = lazy(() => import('./styleguide/StyleGuide'))

function Root() {
  const path = usePath().replace(/\/+$/, '') || '/'
  if (path === '/styleguide') {
    return (
      <Suspense fallback={null}>
        <StyleGuide />
      </Suspense>
    )
  }
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

// Install the offline shell in production only, so dev servers keep hot reload.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a bonus, never a blocker */
    })
  })
}
