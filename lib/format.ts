/**
 * Display helpers. Times are pinned to the venue's timezone so server-rendered HTML (UTC on Vercel)
 * matches what the browsers in the room render.
 */
export const EVENT_TZ = "America/Phoenix"
export const EVENT_LOCALE = "en-US"

export function fmtTime(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString(EVENT_LOCALE, { hour: "numeric", minute: "2-digit", timeZone: EVENT_TZ })
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(EVENT_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TZ,
  })
}

export function fmtAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function fmtUsd(n: number) {
  return `$${n.toFixed(2)}`
}

/** For <input type="datetime-local">: ISO → local "YYYY-MM-DDTHH:mm". */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Local "YYYY-MM-DDTHH:mm" → ISO (null when empty). Must run in the browser. */
export function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null
}

export function splitDuration(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 }
}

export function fmtDay(iso: string, month: "long" | "short" = "short") {
  return new Date(iso).toLocaleDateString(EVENT_LOCALE, { weekday: "long", month, day: "numeric", timeZone: EVENT_TZ })
}
