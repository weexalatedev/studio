import { useState } from 'react'

/** Simple auth gate - replaces Clerk SignedIn/SignedOut */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)

  return (
    <>
      {signedIn ? children : null}
      {!signedIn && (
        <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fa] p-6">
          <div>
            <strong>Sign in required</strong>
            <br />
            <a href="#signin" className="mt-2 text-primary">Sign in</a>
          </div>
        </div>
      )}
      {signedIn && (
        <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fa] p-6">
          <span>Signed in successfully</span>
        </div>
      )}
    </>
  )
}