import type React from 'react'

// Minimal fallback to make `JSX` types available to the project when
// automatic discovery of @types/react's global JSX namespace fails.
// This keeps the fix small and local; you can remove this file once
// the underlying types resolution is fixed.

declare global {
  namespace JSX {
    // JSX.Element maps to React.ReactElement
    type Element = React.ReactElement

    // Allow any intrinsic elements (keeps the compiler happy)
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export {}
