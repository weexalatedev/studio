import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

/** Require a signed-in Clerk user before the app is visible. */
export function AuthGate({ children }: { children: React.ReactNode }) {
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