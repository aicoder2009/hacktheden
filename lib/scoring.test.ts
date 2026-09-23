import { describe, expect, it } from "vitest"
import { judgeScore, rankTeams } from "./scoring"
import type { Criterion, Score } from "./types"

const criteria: Criterion[] = [
  { id: "a", name: "A", description: "", weight: 2 },
  { id: "b", name: "B", description: "", weight: 1 },
]

const sheet = (teamId: string, judgeId: string, scores: Record<string, number>): Score => ({
  teamId,
  judgeId,
  judgeName: judgeId,
  scores,
  notes: "",
  updatedAt: "",
})

describe("judgeScore", () => {
  it("computes a weighted mean", () => {
    expect(judgeScore(criteria, { a: 10, b: 4 })).toBeCloseTo(8)
  })
  it("returns null for incomplete sheets", () => {
    expect(judgeScore(criteria, { a: 10 })).toBeNull()
  })
  it("ignores scores for criteria no longer in the rubric", () => {
    expect(judgeScore(criteria, { a: 5, b: 5, removed: 1 })).toBe(5)
  })
  it("returns null with no criteria", () => {
    expect(judgeScore([], {})).toBeNull()
  })
})

describe("rankTeams", () => {
  const subs = [
    { teamId: "t1", firstSubmittedAt: "2026-11-14T10:00:00Z" },
    { teamId: "t2", firstSubmittedAt: "2026-11-14T09:00:00Z" },
    { teamId: "t3", firstSubmittedAt: "2026-11-14T08:00:00Z" },
  ]

  it("averages complete sheets across judges and sorts descending", () => {
    const ranked = rankTeams(
      criteria,
      [sheet("t1", "j1", { a: 6, b: 6 }), sheet("t1", "j2", { a: 8, b: 8 }), sheet("t2", "j1", { a: 9, b: 9 }), sheet("t2", "j2", { a: 3 })],
      subs
    )
    expect(ranked.map((r) => r.teamId)).toEqual(["t2", "t1", "t3"])
    expect(ranked[0]).toMatchObject({ score: 9, nJudges: 1, rank: 1 })
    expect(ranked[1]).toMatchObject({ score: 7, nJudges: 2 })
  })

  it("puts unscored teams last", () => {
    const ranked = rankTeams(criteria, [sheet("t3", "j1", { a: 1, b: 1 })], subs)
    expect(ranked[0].teamId).toBe("t3")
    expect(ranked.slice(1).every((r) => r.score === null)).toBe(true)
  })

  it("breaks ties on the heaviest criterion first", () => {
    // Both weighted mean 6: t1 = (2*7 + 4)/3, t2 = (2*5 + 8)/3
    const ranked = rankTeams(criteria, [sheet("t1", "j", { a: 7, b: 4 }), sheet("t2", "j", { a: 5, b: 8 })], subs)
    expect(ranked.map((r) => r.teamId).slice(0, 2)).toEqual(["t1", "t2"])
    expect(ranked[0].tied && ranked[1].tied).toBe(true)
  })

  it("then breaks ties on number of judges", () => {
    const ranked = rankTeams(
      criteria,
      [sheet("t1", "j1", { a: 5, b: 5 }), sheet("t2", "j1", { a: 5, b: 5 }), sheet("t2", "j2", { a: 5, b: 5 })],
      subs
    )
    expect(ranked[0].teamId).toBe("t2")
  })

  it("finally breaks ties on earlier submission", () => {
    const ranked = rankTeams(criteria, [sheet("t1", "j", { a: 5, b: 5 }), sheet("t2", "j", { a: 5, b: 5 })], subs)
    expect(ranked[0].teamId).toBe("t2")
    expect(ranked[2].tied).toBe(false)
  })
})
