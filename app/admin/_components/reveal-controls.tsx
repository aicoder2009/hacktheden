"use client"

import { setRevealStage } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { useAction } from "@/components/use-action"
import { cn } from "@/lib/utils"

export type StageLabel = { label: string; team: string | null }

export function RevealControls({ stages, current }: { stages: StageLabel[]; current: number | null }) {
  const { pending, exec } = useAction()
  const last = stages.length - 1
  const go = (stage: number | null) => {
    if (stage === last && !window.confirm("Show the finale? This also releases results to all participants.")) return
    void exec(() => setRevealStage(stage))
  }

  return (
    <div className="grid gap-4">
      <ol className="grid gap-px border bg-border">
        {stages.map((s, i) => {
          const done = current !== null && i < current
          const active = current === i
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-3 bg-background px-3 py-2",
                active && "bg-primary/10 ring-1 ring-primary ring-inset",
                done && "text-muted-foreground"
              )}
            >
              <span className="w-5 shrink-0 font-mono">{i}</span>
              <span className="font-medium">{s.label}</span>
              {s.team && <span className="ml-auto truncate text-muted-foreground">{s.team}</span>}
              {active && <span className="shrink-0 text-[10px] font-semibold text-primary uppercase">on screen</span>}
            </li>
          )
        })}
      </ol>
      <p className="text-[11px] text-muted-foreground">
        Reaching <span className="font-medium text-foreground">Finale</span> automatically releases results to participants.
      </p>
      <div className="flex flex-wrap gap-2">
        {current === null ? (
          <Button disabled={pending} onClick={() => go(0)}>
            Start reveal
          </Button>
        ) : (
          <>
            <Button variant="outline" disabled={pending || current <= 0} onClick={() => go(Math.max(0, current - 1))}>
              ← Back
            </Button>
            <Button disabled={pending || current >= last} onClick={() => go(Math.min(last, current + 1))}>
              Next →
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => go(null)}>
              Exit reveal
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
