"use client"

import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSyncExternalStore } from "react"
import useSWR from "swr"
import { useNow } from "@/app/mentor/_components/use-now"
import { announcementState } from "@/lib/announcements"
import { fmtAgo } from "@/lib/format"
import type { LatestAnnouncement } from "@/lib/views"

/** `skew` = server clock minus this device's clock, measured on each poll (phones can be minutes off). */
type Live = LatestAnnouncement & { skew: number }

async function fetcher(url: string): Promise<Live> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Announcement request failed (${res.status})`)
  const d = (await res.json()) as LatestAnnouncement
  return { ...d, skew: new Date(d.now).getTime() - Date.now() }
}

// Which post this device dismissed, so closing the banner sticks across pages and reloads.
const DISMISSED_KEY = "dismissedAnnouncement"
const DISMISSED_EVENT = "announcement-dismissed"

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

function subscribeDismissed(cb: () => void) {
  window.addEventListener("storage", cb)
  window.addEventListener(DISMISSED_EVENT, cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(DISMISSED_EVENT, cb)
  }
}

function dismiss(id: string) {
  try {
    localStorage.setItem(DISMISSED_KEY, id)
  } catch {
    // Private mode or blocked storage: the banner still hides until the next render cycle ends.
  }
  window.dispatchEvent(new Event(DISMISSED_EVENT))
}

/**
 * A brand-new post pins to the top of every page, under the header, until it is a few minutes old
 * or the reader closes it. Keyed by post id so each new one slides in again.
 */
export function AnnouncementBanner({ initial }: { initial: LatestAnnouncement }) {
  const { data } = useSWR("/api/announcements", fetcher, {
    fallbackData: { ...initial, skew: 0 },
    refreshInterval: 5000,
  })
  const clientNow = useNow(1000)
  const dismissed = useSyncExternalStore(subscribeDismissed, readDismissed, () => null)

  // Times are compared after hydration only, so server and client render the same shell.
  if (clientNow === null) return null
  const ann = data.announcement
  if (!ann || dismissed === ann.id) return null
  const now = clientNow + data.skew
  if (announcementState(ann, now) === "settled") return null

  return (
    <div
      key={ann.id}
      role="status"
      aria-live="polite"
      className="sticky top-12 z-20 animate-in border-b border-primary bg-primary text-primary-foreground duration-500 fade-in slide-in-from-top-2"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3">
        <span aria-hidden className="mt-1.5 size-2 shrink-0 animate-pulse bg-primary-foreground" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest uppercase opacity-80">
            New announcement · {ann.authorName} · {fmtAgo(ann.createdAt, now)}
          </p>
          <p className="mt-0.5 font-heading text-base font-semibold whitespace-pre-wrap sm:text-lg">{ann.body}</p>
        </div>
        <button
          type="button"
          onClick={() => dismiss(ann.id)}
          aria-label="Dismiss announcement"
          className="-m-2 shrink-0 p-2 opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
        </button>
      </div>
    </div>
  )
}
