import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

/*
  A tiny History API router: two routes, `/` (the app) and `/styleguide`.
  The Worker serves index.html for every path (single-page-application mode),
  so deep links and reloads work.
*/

const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname)
}

export function navigate(to: string) {
  if (to === window.location.pathname) return
  window.history.pushState(null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

/** An <a> that navigates without a reload (modifier-clicks still open a new tab). */
export function Link({ to, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={to}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    />
  )
}
