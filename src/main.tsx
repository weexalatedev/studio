import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { AuthGate } from './app/AuthGate'
import { usePath } from './router'
import './styles.css'

const StyleGuide = lazy(() => import('./styleguide/StyleGuide'))

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

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
    <AuthGate>
      <App />
    </AuthGate>
  )
}

const tree = (
  <StrictMode>
    <Root />
  </StrictMode>
)

const root = createRoot(document.getElementById('root')!)

if (clerkKey) {
  // Clerk is loaded lazily so the bundle stays small when auth is not configured.
  import('@clerk/clerk-react').then(({ ClerkProvider }) => {
    root.render(<ClerkProvider publishableKey={clerkKey}>{tree}</ClerkProvider>)
  })
} else {
  root.render(tree)
}

// Install the offline shell in production only, so dev servers keep hot reload.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a bonus, never a blocker */
    })
  })
}
