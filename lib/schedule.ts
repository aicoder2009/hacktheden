import type { ScheduleItem } from "./types"

export function sortSchedule(items: ScheduleItem[]) {
  return [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

/** Current = latest item that has started and not ended; next = first item starting after now. */
export function currentAndNext(items: ScheduleItem[], now: Date) {
  const t = now.getTime()
  const sorted = sortSchedule(items)
  const started = sorted.filter((i) => new Date(i.startsAt).getTime() <= t)
  const last = started.at(-1)
  const current = last && (!last.endsAt || new Date(last.endsAt).getTime() > t) ? last : null
  const next = sorted.find((i) => new Date(i.startsAt).getTime() > t) ?? null
  return { current, next }
}
