"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JudgeProgress } from "./judge-progress"
import { useLive, type LiveData } from "./use-live"

export function OverviewLive({ fallback }: { fallback: LiveData }) {
  const { data, stale } = useLive(fallback)
  const { stats, leaderboard } = data
  const tiles = [
    { label: "Verified participants", value: stats.verified },
    { label: "Teams", value: stats.teams },
    { label: "Submitted projects", value: stats.submissions },
    { label: "Open help tickets", value: stats.openTickets, warn: stats.openTickets > 0 },
  ]
  const top = leaderboard.rows.slice(0, 5)

  return (
    <div className="grid min-w-0 gap-6">
      <div className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-background p-4">
            <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{t.label}</div>
            <div className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${t.warn ? "text-primary" : ""}`}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
      {stale && <p className="-mt-4 text-[11px] text-destructive">Live refresh failed — showing the last known numbers.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardAction>
              <Link href="/admin/judging" className={buttonVariants({ variant: "ghost", size: "xs" })}>
                Full table →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <p className="text-muted-foreground">No submitted projects yet.</p>
            ) : (
              <ol className="grid gap-2">
                {top.map((r) => (
                  <li key={r.teamId} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 font-mono text-muted-foreground">{r.rank}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.teamName}</div>
                      {r.project && <div className="truncate text-muted-foreground">{r.project}</div>}
                    </div>
                    {r.tied && <Badge variant="outline">tie</Badge>}
                    <span className="shrink-0 font-mono tabular-nums">{r.score === null ? "—" : r.score.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Judge progress</CardTitle>
          </CardHeader>
          <CardContent>
            <JudgeProgress judges={leaderboard.judgeProgress} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
