"use client"

import { FullScreenIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { useNow } from "@/app/mentor/_components/use-now"
import { Countdown } from "@/components/countdown"
import { fmtAgo, fmtTime } from "@/lib/format"
import type { ScheduleItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { ScreenData } from "@/lib/views"
import { JoinQr } from "./join-qr"
import { Reveal } from "./reveal"

/** `skew` = server clock − this machine's clock, measured on each poll (the projector laptop may be off). */
type Live = ScreenData & { skew: number }

// Presigned photo URLs change on every poll; reuse the first one we saw so <img> doesn't reload every 3s.
const photoCache = new Map<string, { url: string; at: number }>()
function stablePhoto(url: string | null) {
  if (!url) return url
  const key = url.split("?")[0]
  const hit = photoCache.get(key)
  if (hit && Date.now() - hit.at < 45 * 60_000) return hit.url
  photoCache.set(key, { url, at: Date.now() })
  return url
}

async function fetcher(url: string): Promise<Live> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Screen request failed (${res.status})`)
  const d = (await res.json()) as ScreenData
  return {
    ...d,
    skew: new Date(d.serverNow).getTime() - Date.now(),
    reveal: d.reveal?.map((s) => ("photo" in s ? { ...s, photo: stablePhoto(s.photo) } : s)) ?? null,
  }
}

export function Screen({ token, initial }: { token: string; initial: ScreenData }) {
  const { data, error } = useSWR(`/api/screen/${token}`, fetcher, {
    fallbackData: { ...initial, skew: 0 },
    refreshInterval: 3000,
    revalidateOnFocus: false,
  })
  const clientNow = useNow(1000)
  useEffect(() => {
    initial.reveal?.forEach((s) => "photo" in s && stablePhoto(s.photo))
  }, [initial])
  const idle = useIdle(3000)

  return (
    <div className="dark">
      <div
        className={cn(
          "relative min-h-svh overflow-hidden bg-background text-foreground [--primary-foreground:var(--background)] [--primary:var(--chart-2)]",
          idle && "cursor-none"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4vw_4vw] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_80%)]"
        />
        {/* Render only after hydration: times are formatted in the projector's timezone. */}
        {clientNow !== null &&
          (data.reveal?.length ? (
            <Reveal stages={data.reveal} eventName={data.name} />
          ) : (
            <Normal data={data} now={clientNow + data.skew} />
          ))}

        {error && (
          <div className="fixed bottom-[1vw] left-[1vw] flex items-center gap-2 font-mono text-[0.8vw] text-muted-foreground">
            <span className="size-2 animate-pulse bg-destructive" /> Reconnecting…
          </div>
        )}
        <Link
          href="/home"
          className={cn(
            "fixed top-[1vw] left-1/2 z-50 -translate-x-1/2 px-2 py-1 font-mono text-xs text-muted-foreground opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100",
            idle && "pointer-events-none opacity-0"
          )}
        >
          ← Back to app
        </Link>
        <button
          type="button"
          aria-label="Toggle fullscreen"
          onClick={toggleFullscreen}
          className={cn(
            "fixed right-[1vw] bottom-[1vw] z-50 p-2 text-muted-foreground opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100",
            idle && "opacity-0"
          )}
        >
          <HugeiconsIcon icon={FullScreenIcon} className="size-5" />
        </button>
      </div>
    </div>
  )
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen().catch(() => {})
}

/** True after `ms` without mouse movement (hides the cursor and controls on the projector). */
function useIdle(ms: number) {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    let t = setTimeout(() => setIdle(true), ms)
    const wake = () => {
      setIdle(false)
      clearTimeout(t)
      t = setTimeout(() => setIdle(true), ms)
    }
    window.addEventListener("mousemove", wake)
    return () => {
      clearTimeout(t)
      window.removeEventListener("mousemove", wake)
    }
  }, [ms])
  return idle
}

function Normal({ data, now }: { data: Live; now: number }) {
  const deadline = data.deadline
  const ended = !!deadline && now >= new Date(deadline).getTime()
  const ann = data.announcement
  const fresh = !!ann && now - new Date(ann.createdAt).getTime() < 5 * 60_000
  const stats = [
    { label: "Checked in", value: data.stats.verified },
    { label: "Teams", value: data.stats.teams },
    { label: "Submissions", value: data.stats.submissions },
    { label: "Help requests open", value: data.stats.openTickets },
  ]

  return (
    <div className="relative flex min-h-svh flex-col gap-[1.6vw] p-[2.5vw]">
      <header className="flex items-center justify-between gap-[2vw]">
        <div className="flex min-w-0 items-center gap-[1vw] font-heading text-[1.8vw] font-semibold">
          <span className="grid size-[2.6vw] shrink-0 place-items-center bg-primary text-[1vw] font-bold text-primary-foreground">
            LP
          </span>
          <span className="truncate">{data.name}</span>
        </div>
        <div className="font-mono text-[2.2vw] tabular-nums">{fmtTime(new Date(now).toISOString())}</div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        {!deadline ? (
          <h1 className="max-w-[85vw] font-heading text-[7vw] leading-[0.95] font-bold tracking-tight text-balance">
            {data.name}
          </h1>
        ) : ended ? (
          <>
            <p className="font-heading text-[8vw] leading-none font-bold text-primary">Hands off keyboards!</p>
            <p className="mt-[1.5vw] font-mono text-[1.6vw] tracking-[0.3em] text-muted-foreground uppercase">
              Submissions are closed
            </p>
          </>
        ) : (
          <>
            <Countdown
              target={deadline}
              serverNow={data.serverNow}
              doneLabel="Hands off keyboards!"
              className="font-mono text-[14vw] leading-[0.9] font-semibold tracking-tight"
            />
            <p className="mt-[1vw] font-mono text-[1.6vw] tracking-[0.3em] text-primary uppercase">
              until submissions close
            </p>
          </>
        )}
      </section>

      <section className="grid grid-cols-3 gap-px border bg-border">
        <Panel label="Room code">
          <div className="flex items-center gap-[1.5vw]">
            <div className="min-w-0">
              <div className="font-mono text-[3.6vw] leading-none font-bold tracking-[0.12em] whitespace-nowrap text-primary">
                {data.roomCode}
              </div>
              <p className="mt-[1vw] text-[1.1vw] text-muted-foreground">
                Scan or go to <span className="font-mono text-foreground">{window.location.host}/join</span>
              </p>
            </div>
            <JoinQr className="size-[8vw] shrink-0" />
          </div>
        </Panel>

        <Panel label="Schedule">
          {!data.current && !data.next ? (
            <p className="text-[1.4vw] text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <div className="space-y-[1.2vw]">
              {data.current && <ScheduleRow tag="Now" item={data.current} live />}
              {data.next && <ScheduleRow tag="Next" item={data.next} />}
            </div>
          )}
        </Panel>

        <Panel label="Latest announcement" highlight={fresh} badge={fresh ? "New" : undefined}>
          {ann ? (
            <>
              <p className="line-clamp-3 text-[1.5vw] leading-snug font-medium">{ann.body}</p>
              <p className="mt-[0.8vw] font-mono text-[0.9vw] text-muted-foreground">
                {ann.authorName} · {fmtAgo(ann.createdAt, now)}
              </p>
            </>
          ) : (
            <p className="text-[1.4vw] text-muted-foreground">No announcements yet.</p>
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-4 gap-px border bg-border">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-[1vw] bg-background px-[1.6vw] py-[1.2vw]">
            <span className="font-mono text-[0.9vw] tracking-[0.2em] text-muted-foreground uppercase">{s.label}</span>
            <span className="font-mono text-[3.4vw] leading-none font-bold tabular-nums">{s.value}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function Panel({
  label,
  highlight,
  badge,
  children,
}: {
  label: string
  highlight?: boolean
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("min-w-0 bg-background p-[1.6vw] transition-colors", highlight && "bg-primary/15")}>
      <div className="mb-[1vw] flex items-center gap-[0.8vw]">
        <span className="font-mono text-[0.9vw] tracking-[0.25em] text-muted-foreground uppercase">{label}</span>
        {badge && (
          <span className="animate-pulse bg-primary px-[0.5vw] font-mono text-[0.8vw] font-bold text-primary-foreground uppercase">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function ScheduleRow({ tag, item, live }: { tag: string; item: ScheduleItem; live?: boolean }) {
  return (
    <div className="flex items-baseline gap-[1vw]">
      <span className={cn("w-[3.5vw] shrink-0 font-mono text-[0.9vw] uppercase", live ? "text-primary" : "text-muted-foreground")}>
        {tag}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[1.6vw] leading-tight font-semibold">{item.title}</div>
        <div className="font-mono text-[1vw] text-muted-foreground">
          {fmtTime(item.startsAt)}
          {item.endsAt && `–${fmtTime(item.endsAt)}`}
          {item.location && ` · ${item.location}`}
        </div>
      </div>
    </div>
  )
}
