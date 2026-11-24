import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { usePath } from './router'
import './styles.css'

const StyleGuide = lazy(() => import('./styleguide/StyleGuide'))
const AuthGate = lazy(() => import('./app/AuthGate').then((m) => ({ default: m.AuthGate })))

function Root() {
  const path = usePath().replace(/\/+$/, '') || '/'
  if (path === '/styleguide') {
    return (
      <Suspense fallback={null}>
        <StyleGuide />
      </Suspense>
    )
  }
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-[14px] text-muted">Loading…</div>}>
      <AuthGate>
        <App />
      </AuthGate>
    </Suspense>
  )
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
