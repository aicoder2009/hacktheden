"use client"

import { useCallback, useSyncExternalStore } from "react"

/** Current time rounded down to `stepMs`, re-rendering every step. `null` during SSR/hydration. */
export function useNow(stepMs = 1000) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const id = setInterval(cb, stepMs)
      return () => clearInterval(id)
    },
    [stepMs]
  )
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / stepMs) * stepMs,
    () => null
  )
}
