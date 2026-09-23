"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { JudgeProgress } from "./judge-progress"
import { useLive, type LiveData } from "./use-live"

export function LiveLeaderboard({ fallback }: { fallback: LiveData }) {
  const { data, stale } = useLive(fallback)
  const { criteria, rows, judgeProgress } = data.leaderboard

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            Submitted projects only. Only complete score sheets count. Refreshes every 5s.
            {stale && <span className="ml-1 text-destructive">Refresh failed — showing last known data.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Project</TableHead>
                {criteria.map((c) => (
                  <TableHead key={c.id} className="text-right" title={c.description}>
                    {c.name}
                    {c.weight !== 1 && <span className="ml-1 text-muted-foreground">×{c.weight}</span>}
                  </TableHead>
                ))}
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="pr-4 text-right">Judges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.teamId}>
                  <TableCell className="pl-4 font-mono text-muted-foreground">{r.rank}</TableCell>
                  <TableCell className="font-medium">
                    {r.teamName}
                    {r.tied && (
                      <Badge variant="outline" className="ml-2 border-primary text-primary">
                        tie
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">{r.project || "—"}</TableCell>
                  {criteria.map((c) => (
                    <TableCell key={c.id} className="text-right font-mono tabular-nums">
                      {r.criterionMeans[c.id] === undefined ? "—" : r.criterionMeans[c.id].toFixed(1)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-mono font-semibold tabular-nums">
                    {r.score === null ? "—" : r.score.toFixed(2)}
                  </TableCell>
                  <TableCell className="pr-4 text-right font-mono tabular-nums">{r.nJudges}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={criteria.length + 5} className="py-8 text-center text-muted-foreground">
                    No submitted projects yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {rows.some((r) => r.tied) && (
            <p className="px-4 pt-3 text-[11px] text-muted-foreground">
              Ties are broken by per-criterion means (highest weight first), then more judges, then earlier submission.
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Judge progress</CardTitle>
          <CardDescription>Complete sheets / submitted projects</CardDescription>
        </CardHeader>
        <CardContent>
          <JudgeProgress judges={judgeProgress} />
        </CardContent>
      </Card>
    </div>
  )
}
