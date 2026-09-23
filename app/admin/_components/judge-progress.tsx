import type { LeaderboardData } from "@/lib/views"

export function JudgeProgress({ judges }: { judges: LeaderboardData["judgeProgress"] }) {
  if (judges.length === 0) return <p className="text-xs text-muted-foreground">No judges yet — assign the judge role on the People page.</p>
  return (
    <ul className="grid gap-3">
      {judges.map((j) => {
        const pct = j.total ? Math.round((j.scored / j.total) * 100) : 0
        return (
          <li key={j.id} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium">{j.name}</span>
              <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                {j.scored}/{j.total}
              </span>
            </div>
            <div className="h-1 w-full bg-muted">
              <div
                className={j.total > 0 && j.scored >= j.total ? "h-full bg-emerald-500" : "h-full bg-primary"}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
