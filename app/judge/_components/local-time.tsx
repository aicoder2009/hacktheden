"use client"

import { useSyncExternalStore } from "react"
import { fmtDateTime } from "@/lib/format"

const noop = () => () => {}

/** Formats in the viewer's timezone (the server may be in UTC), so it renders after hydration. */
export function LocalTime({ iso }: { iso: string | null }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false)
  return <span suppressHydrationWarning>{hydrated ? fmtDateTime(iso) : "…"}</span>
}
