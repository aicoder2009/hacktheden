"use client"

import { useSyncExternalStore } from "react"

const noop = () => () => {}

/** True only in the browser (after hydration) — use for anything timezone- or window-dependent. */
export function useIsClient() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}

export function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => ""
  )
}
