"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { claimTicket, resolveTicket, unclaimTicket } from "@/actions/tickets"
import { useAction } from "@/components/use-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ActionResult } from "@/lib/action"
import { fmtAgo } from "@/lib/format"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useNow } from "./use-now"

const KEY = "/api/mentor/queue"

async function fetcher(url: string): Promise<Ticket[]> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Queue request failed (${res.status})`)
  return res.json()
}

export function MentorQueue({ meId, initial }: { meId: string; initial: Ticket[] }) {
  const { data = initial, error, mutate } = useSWR(KEY, fetcher, { fallbackData: initial, refreshInterval: 5000 })
  const { pending, exec } = useAction()
  const now = useNow(15_000)

  const byAge = (a: Ticket, b: Ticket) => a.createdAt.localeCompare(b.createdAt)
  const open = data.filter((t) => t.status === "open").sort(byAge)
  const claimed = data
    .filter((t) => t.status === "claimed")
    .sort((a, b) => Number(b.mentorId === meId) - Number(a.mentorId === meId) || byAge(a, b))
  const resolved = data
    .filter((t) => t.status === "resolved")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10)

  useEffect(() => {
    document.title = open.length ? `(${open.length}) Help queue · Launchpad` : "Help queue · Launchpad"
  }, [open.length])

  async function act(fn: () => Promise<ActionResult<null>>, success: string) {
    await exec(fn, { success, refresh: false })
    await mutate()
  }

  const ago = (iso: string) => (now === null ? "" : fmtAgo(iso, now))

  return (
    <div className="space-y-8">
      {error && (
        <p className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Can&apos;t reach the server — showing the last known queue. Retrying…
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Column title="Open" count={open.length} accent>
          {open.length === 0 && <Empty>Nobody is waiting. Nice.</Empty>}
          {open.map((t) => (
            <TicketCard key={t.id} ticket={t} meta={now === null ? "" : `waiting ${ago(t.createdAt).replace(" ago", "")}`}>
              <Button size="sm" disabled={pending} onClick={() => act(() => claimTicket(t.id), "Claimed — go find them!")}>
                Claim
              </Button>
            </TicketCard>
          ))}
        </Column>

        <Column title="Claimed" count={claimed.length}>
          {claimed.length === 0 && <Empty>No one is being helped right now.</Empty>}
          {claimed.map((t) => {
            const mine = t.mentorId === meId
            return (
              <TicketCard
                key={t.id}
                ticket={t}
                mine={mine}
                meta={`${mine ? "You" : (t.mentorName ?? "A mentor")} · ${ago(t.updatedAt)}`}
              >
                <Button size="sm" disabled={pending} onClick={() => act(() => resolveTicket(t.id), "Marked resolved")}>
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => act(() => unclaimTicket(t.id), "Released back to the queue")}
                >
                  Release
                </Button>
              </TicketCard>
            )
          })}
        </Column>
      </div>

      <details className="group border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none">
          <span className="font-heading text-sm font-semibold">
            Recently resolved <span className="font-mono text-xs text-muted-foreground">{resolved.length}</span>
          </span>
          <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
          <span className="hidden text-xs text-muted-foreground group-open:inline">Hide</span>
        </summary>
        {resolved.length === 0 ? (
          <p className="border-t px-4 py-3 text-xs text-muted-foreground">Nothing resolved yet.</p>
        ) : (
          <ul className="divide-y border-t">
            {resolved.map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2 text-xs">
                <span className="font-medium">{t.topic}</span>
                <span className="text-muted-foreground">{t.teamName}</span>
                <span className="ml-auto text-muted-foreground">
                  {t.mentorId === meId ? "You" : (t.mentorName ?? "—")} · {ago(t.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  )
}

function Column({
  title,
  count,
  accent,
  children,
}: {
  title: string
  count: number
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold">
        {title}
        <Badge variant={accent && count > 0 ? "default" : "outline"} className="font-mono">
          {count}
        </Badge>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function TicketCard({
  ticket: t,
  meta,
  mine,
  children,
}: {
  ticket: Ticket
  meta: string
  mine?: boolean
  children: React.ReactNode
}) {
  return (
    <article
      className={cn(
        "bg-card p-4 text-xs/relaxed ring-1 ring-foreground/10",
        mine && "bg-primary/5 ring-2 ring-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-semibold">{t.topic}</h3>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{t.teamName}</span> · {t.location}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mine && <Badge>Mine</Badge>}
          <span className="font-mono text-muted-foreground">{meta}</span>
        </div>
      </div>
      {t.description && <p className="mt-2 whitespace-pre-wrap">{t.description}</p>}
      <div className="mt-3 flex gap-2">{children}</div>
    </article>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed p-6 text-center text-xs text-muted-foreground">{children}</p>
}
