import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { badgeVariants } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { pageUser } from "@/lib/auth"
import { listScores } from "@/lib/data"
import { judgeScore } from "@/lib/scoring"
import { cn } from "@/lib/utils"
import { judgingQueue, scoringClosedReason } from "./_components/queue"
import { ScoringBanner } from "./_components/scoring-banner"

type Status = "todo" | "partial" | "done"
const STATUS: Record<Status, { label: string; variant: "outline" | "secondary" | "default" }> = {
  todo: { label: "Not started", variant: "outline" },
  partial: { label: "In progress", variant: "secondary" },
  done: { label: "Done", variant: "default" },
}

export default async function JudgePage() {
  const user = await pageUser("judge", "officer")
  const [{ event, rows }, scores] = await Promise.all([judgingQueue(), listScores()])
  const mine = new Map(scores.filter((s) => s.judgeId === user.id).map((s) => [s.teamId, s]))

  const items = rows.map((r) => {
    const s = mine.get(r.sub.teamId)
    const status: Status = !s ? "todo" : judgeScore(event.criteria, s.scores) !== null ? "done" : "partial"
    return { ...r, status }
  })
  const done = items.filter((i) => i.status === "done").length
  const closed = scoringClosedReason(event)
  const nextUp = items.find((i) => i.status !== "done")

  return (
    <>
      <PageHeader title="Judging" description={`Score each project on ${event.criteria.length} criteria, 1–10.`}>
        <div className="w-48">
          <Progress value={items.length ? (done / items.length) * 100 : 0}>
            <span className="text-xs font-medium">
              <span className="font-mono">{done}</span> of <span className="font-mono">{items.length}</span> scored
            </span>
          </Progress>
        </div>
      </PageHeader>

      <ScoringBanner reason={closed} />

      {!closed && nextUp && (
        <Link
          href={`/judge/${nextUp.sub.teamId}`}
          className="group mb-6 flex items-center justify-between gap-4 bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/85"
        >
          <div className="min-w-0">
            <div className="font-heading text-sm font-semibold">Score next unscored team</div>
            <div className="truncate text-xs opacity-80">
              {nextUp.sub.name || "Untitled project"} by {nextUp.teamName}
              {nextUp.status === "partial" && " · in progress"}
            </div>
          </div>
          <span aria-hidden className="text-lg transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
      {!closed && items.length > 0 && !nextUp && (
        <p className="mb-6 border border-primary/40 bg-primary/5 px-4 py-3 text-xs text-primary">
          ✓ You&apos;ve scored every project. Open one to adjust a score.
        </p>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed p-10 text-center text-sm text-muted-foreground">
          No projects have been submitted yet.
        </div>
      ) : (
        <ul className="grid gap-px border bg-border">
          {items.map((i, n) => (
            <li key={i.sub.teamId}>
              <Link
                href={`/judge/${i.sub.teamId}`}
                className="group flex items-center gap-4 bg-background p-4 transition-colors hover:bg-muted/50"
              >
                <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-heading text-sm font-semibold">{i.sub.name || "Untitled project"}</span>
                    <span className="text-xs text-muted-foreground">by {i.teamName}</span>
                  </div>
                  {i.sub.tagline && <p className="mt-0.5 truncate text-xs text-muted-foreground">{i.sub.tagline}</p>}
                </div>
                <span
                  className={cn(
                    badgeVariants({ variant: STATUS[i.status].variant }),
                    i.status === "todo" && "text-muted-foreground"
                  )}
                >
                  {STATUS[i.status].label}
                </span>
                <span className="text-xs text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
