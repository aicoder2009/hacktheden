"use client"

import { fmtAgo, fmtDateTime, fmtTime } from "@/lib/format"
import { useIsClient } from "./client-only"

/** Formats in the viewer's timezone (renders a placeholder during SSR). */
export function LocalTime({ iso, mode = "datetime" }: { iso: string | null | undefined; mode?: "datetime" | "time" | "ago" }) {
  const client = useIsClient()
  if (!iso) return <span className="text-muted-foreground">—</span>
  if (!client) return <span className="text-muted-foreground">…</span>
  const text = mode === "ago" ? fmtAgo(iso) : mode === "time" ? fmtTime(iso) : fmtDateTime(iso)
  return (
    <time dateTime={iso} title={fmtDateTime(iso)}>
      {text}
    </time>
  )
}
