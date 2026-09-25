import type { Announcement } from "./types"

/** A new post takes over the middle of the big screen for this long. */
export const ANNOUNCEMENT_TAKEOVER_MS = 2 * 60_000
/**
 * A post counts as "new" for this long: pinned to the top of every page in the app and highlighted
 * on the big screen. After that it settles into the screen's announcement panel and the dashboard list.
 */
export const ANNOUNCEMENT_FRESH_MS = 10 * 60_000

export type AnnouncementState = "takeover" | "fresh" | "settled"

/** How loudly to show a post, from how long ago it was sent. `now` should be server-corrected. */
export function announcementState(ann: Pick<Announcement, "createdAt"> | null | undefined, now: number): AnnouncementState {
  if (!ann) return "settled"
  const age = now - new Date(ann.createdAt).getTime()
  if (age < ANNOUNCEMENT_TAKEOVER_MS) return "takeover"
  if (age < ANNOUNCEMENT_FRESH_MS) return "fresh"
  return "settled"
}

/** Projector text size tier: short posts go huge, long ones shrink so the whole message still fits. */
export function bodyScale(body: string): "xl" | "lg" | "md" | "sm" {
  const n = body.trim().length
  if (n <= 60) return "xl"
  if (n <= 140) return "lg"
  if (n <= 280) return "md"
  return "sm"
}
