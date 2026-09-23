"use client"

import { useState } from "react"
import { deleteScheduleItem, upsertScheduleItem } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAction } from "@/components/use-action"
import { fmtDay, fmtTime, fromLocalInput, toLocalInput } from "@/lib/format"
import type { ScheduleItem } from "@/lib/types"
import { useIsClient } from "./client-only"

type Draft = { id?: string; title: string; startsAt: string; endsAt: string; location: string }
const EMPTY: Draft = { title: "", startsAt: "", endsAt: "", location: "" }

/** Client-only: datetime-local values must use the officer's timezone. */
export function ScheduleEditor({ items }: { items: ScheduleItem[] }) {
  const client = useIsClient()
  if (!client) return <Skeleton className="h-64 w-full" />
  return <Editor items={items} />
}

function Editor({ items }: { items: ScheduleItem[] }) {
  const { pending, exec } = useAction()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [k]: e.target.value })

  function edit(item: ScheduleItem) {
    setDraft({
      id: item.id,
      title: item.title,
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
      location: item.location,
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await exec(
      () =>
        upsertScheduleItem({
          id: draft.id,
          title: draft.title,
          startsAt: fromLocalInput(draft.startsAt),
          endsAt: fromLocalInput(draft.endsAt),
          location: draft.location,
        }),
      { success: draft.id ? "Item updated" : "Item added" }
    )
    if (ok !== undefined) setDraft(EMPTY)
  }

  function remove(item: ScheduleItem) {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    void exec(() => deleteScheduleItem(item.id), { success: "Item deleted" }).then(() => {
      if (draft.id === item.id) setDraft(EMPTY)
    })
  }

  // Group by local day so multi-day events stay readable.
  const day = (iso: string) => fmtDay(iso)
  const days = [...new Set(items.map((i) => day(i.startsAt)))]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid h-fit gap-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No schedule items yet.</p>}
        {days.map((d) => (
          <section key={d}>
            <h2 className="mb-2 text-[11px] tracking-widest text-muted-foreground uppercase">{d}</h2>
            <ol className="grid gap-px border bg-border">
              {items
                .filter((i) => day(i.startsAt) === d)
                .map((i) => (
                  <li
                    key={i.id}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-1 bg-background px-3 py-2 text-xs ${draft.id === i.id ? "ring-1 ring-primary ring-inset" : ""}`}
                  >
                    <span className="w-32 shrink-0 font-mono tabular-nums">
                      {fmtTime(i.startsAt)}
                      {i.endsAt && `–${fmtTime(i.endsAt)}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{i.title}</span>
                      {i.location && <span className="ml-2 text-muted-foreground">{i.location}</span>}
                    </span>
                    <span className="flex gap-1">
                      <Button variant="ghost" size="xs" onClick={() => edit(i)} disabled={pending}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => remove(i)} disabled={pending}>
                        Delete
                      </Button>
                    </span>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{draft.id ? "Edit item" : "Add item"}</CardTitle>
          <CardDescription>Times use your browser&apos;s timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="font-medium">Title</span>
              <Input value={draft.title} onChange={set("title")} required maxLength={80} placeholder="Opening ceremony" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5">
                <span className="font-medium">Starts</span>
                <Input type="datetime-local" value={draft.startsAt} onChange={set("startsAt")} required />
              </label>
              <label className="grid gap-1.5">
                <span className="font-medium">Ends (optional)</span>
                <Input type="datetime-local" value={draft.endsAt} onChange={set("endsAt")} />
              </label>
            </div>
            <label className="grid gap-1.5">
              <span className="font-medium">Location</span>
              <Input value={draft.location} onChange={set("location")} maxLength={60} placeholder="Main hall" />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : draft.id ? "Save changes" : "Add to schedule"}
              </Button>
              {draft.id && (
                <Button type="button" variant="ghost" onClick={() => setDraft(EMPTY)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
