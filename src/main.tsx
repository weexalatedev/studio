import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { usePath } from './router'
import './styles.css'

const StyleGuide = lazy(() => import('./styleguide/StyleGuide'))
const AuthGate = lazy(() => import('./app/AuthGate').then((m) => ({ default: m.AuthGate })))

const clerkKey =
  import.meta.env.NEXT_PUBLIC_VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

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

if (!clerkKey) {
  root.render(
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fa] p-6 text-[14px] text-muted">
      Clerk is not configured. Set VITE_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_VITE_CLERK_PUBLISHABLE_KEY and redeploy.
    </div>,
  )
} else {
  root.render(<div className="flex min-h-dvh items-center justify-center text-[14px] text-muted">Loading…</div>)
  void import('@clerk/clerk-react').then(({ ClerkProvider }) => {
    root.render(
      <StrictMode>
        <ClerkProvider publishableKey={clerkKey}>
          <Root />
        </ClerkProvider>
      </StrictMode>,
    )
  })
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}