import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

/** When Clerk is configured, require a signed-in user. Otherwise the app runs
 *  in local-only mode exactly as before. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  if (!clerkKey) return <>{children}</>
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fa] p-6">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
