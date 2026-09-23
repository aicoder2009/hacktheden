"use client"

import { useState } from "react"
import { updateEvent } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAction } from "@/components/use-action"
import { fromLocalInput, toLocalInput } from "@/lib/format"
import { useIsClient } from "./client-only"

type Initial = {
  name: string
  startsAt: string | null
  submissionDeadline: string | null
  endsAt: string | null
  lumaUrl: string
  aiBudgetUsd: number
}

/** Mounted only in the browser so datetime-local values use the officer's timezone. */
export function EventForm({ initial }: { initial: Initial }) {
  const client = useIsClient()
  if (!client) return <Skeleton className="h-72 w-full" />
  return <Form initial={initial} />
}

function Form({ initial }: { initial: Initial }) {
  const { pending, exec } = useAction()
  const [f, setF] = useState({
    name: initial.name,
    startsAt: toLocalInput(initial.startsAt),
    submissionDeadline: toLocalInput(initial.submissionDeadline),
    endsAt: toLocalInput(initial.endsAt),
    lumaUrl: initial.lumaUrl,
    aiBudgetUsd: String(initial.aiBudgetUsd),
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    void exec(
      () =>
        updateEvent({
          name: f.name,
          startsAt: fromLocalInput(f.startsAt),
          submissionDeadline: fromLocalInput(f.submissionDeadline),
          endsAt: fromLocalInput(f.endsAt),
          lumaUrl: f.lumaUrl.trim(),
          aiBudgetUsd: Number(f.aiBudgetUsd),
        }),
      { success: "Event saved" }
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Event name">
        <Input value={f.name} onChange={set("name")} required maxLength={80} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Starts at">
          <Input type="datetime-local" value={f.startsAt} onChange={set("startsAt")} />
        </Field>
        <Field label="Submission deadline" hint="Teams and submissions lock here.">
          <Input type="datetime-local" value={f.submissionDeadline} onChange={set("submissionDeadline")} />
        </Field>
        <Field label="Ends at">
          <Input type="datetime-local" value={f.endsAt} onChange={set("endsAt")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Luma URL">
          <Input type="url" value={f.lumaUrl} onChange={set("lumaUrl")} placeholder="https://lu.ma/…" />
        </Field>
        <Field label="AI budget per team (USD)">
          <Input type="number" min={0} max={100} step="0.5" value={f.aiBudgetUsd} onChange={set("aiBudgetUsd")} required />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  )
}
