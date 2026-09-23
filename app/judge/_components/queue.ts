import { getEvent, listSubmissions, listTeams } from "@/lib/data"
import { canScore } from "@/lib/rules"
import type { EventMeta } from "@/lib/types"

/** Submitted projects in a stable order (by team name), shared by the list and prev/next links. */
export async function judgingQueue() {
  const [event, subs, teams] = await Promise.all([getEvent(), listSubmissions(), listTeams()])
  const rows = subs
    .filter((s) => s.status === "submitted")
    .map((sub) => {
      const team = teams.find((t) => t.id === sub.teamId)
      return { sub, team, teamName: team?.name ?? "Unknown team" }
    })
    .sort((a, b) => a.teamName.localeCompare(b.teamName))
  return { event, rows }
}

/** Why scoring is closed, or null when judges can score now. */
export function scoringClosedReason(event: EventMeta, now = new Date()) {
  if (canScore(event, now)) return null
  if (event.results) return { kind: "locked" as const }
  return { kind: "not-open" as const, deadline: event.submissionDeadline }
}
