"use client"

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react"
import { saveScore } from "@/actions/judge"
import { useAction } from "@/components/use-action"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { fmtTime } from "@/lib/format"
import { judgeScore } from "@/lib/scoring"
import type { Criterion } from "@/lib/types"
import { cn } from "@/lib/utils"

type Draft = { scores: Record<string, number>; notes: string; rev: number }
const UNTOUCHED = 5
const noop = () => () => {}

export function ScoreForm({
  teamId,
  criteria,
  initial,
  disabled,
}: {
  teamId: string
  criteria: Criterion[]
  initial: { scores: Record<string, number>; notes: string; savedAt: string } | null
  disabled: boolean
}) {
  const { pending, exec } = useAction()
  const [draft, setDraft] = useState<Draft>({ scores: initial?.scores ?? {}, notes: initial?.notes ?? "", rev: 0 })
  const [savedAt, setSavedAt] = useState(initial?.savedAt ?? null)
  const sentRev = useRef(0)
  const latest = useRef(draft)
  // "Saved hh:mm" is in the judge's timezone, so only show it after hydration.
  const hydrated = useSyncExternalStore(noop, () => true, () => false)

  const persist = useEffectEvent(async (d: Draft) => {
    sentRev.current = d.rev
    const res = await exec(() => saveScore(teamId, { scores: d.scores, notes: d.notes }), { refresh: false })
    if (res) setSavedAt(res.savedAt)
  })

  // Debounced autosave after each change.
  useEffect(() => {
    latest.current = draft
    if (draft.rev === 0) return
    const t = setTimeout(() => void persist(draft), 800)
    return () => clearTimeout(t)
  }, [draft])

  // Flush an unsaved change when leaving the page (e.g. clicking Next within the debounce window).
  useEffect(() => {
    const pendingDraft = latest
    const sent = sentRev
    return () => {
      const d = pendingDraft.current
      if (d.rev > sent.current) void saveScore(teamId, { scores: d.scores, notes: d.notes })
    }
  }, [teamId])

  const setScore = (id: string, v: number) =>
    setDraft((d) => (d.scores[id] === v ? d : { ...d, scores: { ...d.scores, [id]: v }, rev: d.rev + 1 }))
  // Pressing an untouched slider without moving it still counts as choosing the shown value.
  const touch = (id: string) =>
    setDraft((d) => (id in d.scores ? d : { ...d, scores: { ...d.scores, [id]: UNTOUCHED }, rev: d.rev + 1 }))

  const total = judgeScore(criteria, draft.scores)
  const scoredCount = criteria.filter((c) => typeof draft.scores[c.id] === "number").length

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Your score</CardTitle>
            <p className="mt-0.5 text-muted-foreground">
              {scoredCount} of {criteria.length} criteria ·{" "}
              <span aria-live="polite">
                {pending ? "Saving…" : savedAt && hydrated ? `Saved ${fmtTime(savedAt)}` : "Saves automatically"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl leading-none font-semibold tabular-nums">
              {total === null ? "–" : total.toFixed(2)}
            </div>
            <div className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">weighted</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {criteria.length === 0 && <p className="text-muted-foreground">No judging criteria have been set up yet.</p>}
        {criteria.map((c) => {
          const value = draft.scores[c.id]
          const touched = typeof value === "number"
          return (
            <div key={c.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Label className="font-heading text-sm">
                    {c.name}
                    {c.weight !== 1 && <span className="font-mono text-[10px] text-muted-foreground">×{c.weight}</span>}
                  </Label>
                  {c.description && <p className="text-muted-foreground">{c.description}</p>}
                </div>
                <span
                  className={cn(
                    "w-10 shrink-0 text-right font-mono text-2xl leading-none font-semibold tabular-nums",
                    touched ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {touched ? value : "–"}
                </span>
              </div>
              <div onPointerDown={() => !disabled && touch(c.id)} className={cn(!touched && "opacity-50")}>
                <Slider
                  aria-label={c.name}
                  min={1}
                  max={10}
                  step={1}
                  value={[touched ? value : UNTOUCHED]}
                  onValueChange={(v) => setScore(c.id, typeof v === "number" ? v : v[0])}
                  disabled={disabled}
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          )
        })}

        <div className="space-y-2">
          <Label htmlFor="judge-notes" className="font-heading text-sm">
            Notes <span className="text-xs font-normal text-muted-foreground">(private to judges)</span>
          </Label>
          <Textarea
            id="judge-notes"
            value={draft.notes}
            maxLength={2000}
            disabled={disabled}
            placeholder="What stood out? Questions for deliberation?"
            className="min-h-24"
            onChange={(e) => {
              const notes = e.target.value
              setDraft((d) => ({ ...d, notes, rev: d.rev + 1 }))
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
