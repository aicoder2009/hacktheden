"use server"

import { parse, run } from "@/lib/action"
import { AppError, requireRole } from "@/lib/auth"
import { getEvent, getSubmission, keys } from "@/lib/data"
import { putItem } from "@/lib/db"
import { canScore } from "@/lib/rules"
import { scoreSchema } from "@/lib/schemas"
import type { Score } from "@/lib/types"

export async function saveScore(teamId: string, input: unknown) {
  return run(async () => {
    const judge = await requireRole("judge", "officer")
    const event = await getEvent()
    if (!canScore(event, new Date())) {
      throw new AppError(event.results ? "Results are locked." : "Scoring opens when hacking ends.")
    }
    const sub = await getSubmission(teamId)
    if (sub?.status !== "submitted") throw new AppError("That team hasn't submitted.")
    const data = parse(scoreSchema, input)
    const ids = new Set(event.criteria.map((c) => c.id))
    const score: Score = {
      teamId,
      judgeId: judge.id,
      judgeName: judge.name,
      scores: Object.fromEntries(Object.entries(data.scores).filter(([k]) => ids.has(k))),
      notes: data.notes,
      updatedAt: new Date().toISOString(),
    }
    await putItem(keys.score(teamId, judge.id), score)
    return { savedAt: score.updatedAt }
  })
}
