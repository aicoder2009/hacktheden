import type { Criterion, Score } from "./types"

const EPS = 1e-9

/** Weighted mean for one judge's sheet, or null if any current criterion is unscored. */
export function judgeScore(criteria: Criterion[], scores: Record<string, number>): number | null {
  if (criteria.length === 0) return null
  let total = 0
  let weights = 0
  for (const c of criteria) {
    const v = scores[c.id]
    if (typeof v !== "number") return null
    total += c.weight * v
    weights += c.weight
  }
  return weights > 0 ? total / weights : null
}

export type RankedTeam = {
  teamId: string
  rank: number
  score: number | null
  criterionMeans: Record<string, number>
  nJudges: number
  /** Ties with another team on overall score (before tiebreakers). */
  tied: boolean
}

type Sub = { teamId: string; firstSubmittedAt?: string }

/**
 * Team score = mean of complete judge sheets. Tiebreak: per-criterion means in weight order,
 * then more complete sheets, then earlier first submission. Unscored teams go last.
 */
export function rankTeams(criteria: Criterion[], scores: Score[], subs: Sub[]): RankedTeam[] {
  const byWeight = [...criteria].sort((a, b) => b.weight - a.weight)
  const submittedAt = new Map(subs.map((s) => [s.teamId, s.firstSubmittedAt ?? "9999"]))

  const rows = subs.map((s) => {
    const sheets = scores.filter((sc) => sc.teamId === s.teamId && judgeScore(criteria, sc.scores) !== null)
    const nJudges = sheets.length
    const score = nJudges ? sheets.reduce((a, sc) => a + judgeScore(criteria, sc.scores)!, 0) / nJudges : null
    const criterionMeans: Record<string, number> = {}
    if (nJudges) for (const c of criteria) criterionMeans[c.id] = sheets.reduce((a, sc) => a + sc.scores[c.id], 0) / nJudges
    return { teamId: s.teamId, score, criterionMeans, nJudges }
  })

  const cmp = (a: (typeof rows)[number], b: (typeof rows)[number]) => {
    if (a.score === null || b.score === null) return a.score === null ? (b.score === null ? 0 : 1) : -1
    if (Math.abs(a.score - b.score) > EPS) return b.score - a.score
    for (const c of byWeight) {
      const d = b.criterionMeans[c.id] - a.criterionMeans[c.id]
      if (Math.abs(d) > EPS) return d
    }
    if (a.nJudges !== b.nJudges) return b.nJudges - a.nJudges
    return submittedAt.get(a.teamId)!.localeCompare(submittedAt.get(b.teamId)!)
  }

  return rows.sort(cmp).map((r, i, all) => ({
    ...r,
    rank: i + 1,
    tied:
      r.score !== null &&
      all.some((o) => o !== r && o.score !== null && Math.abs(o.score - r.score!) <= EPS),
  }))
}
