import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvent, listSubmissions, listTeams } from "@/lib/data"
import { buildStages } from "@/lib/reveal"
import { buildLeaderboard } from "@/lib/views"
import { ReleaseToggle } from "../_components/release-toggle"
import { ResultsLock } from "../_components/results-lock"
import { RevealControls, type StageLabel } from "../_components/reveal-controls"

export const metadata = { title: "Results & reveal" }

const PLACE = ["", "1st place", "2nd place", "3rd place"]

export default async function ResultsPage() {
  const [event, teams, subs, leaderboard] = await Promise.all([getEvent(), listTeams(), listSubmissions(), buildLeaderboard()])
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Unknown team"
  const rankOf = new Map(leaderboard.rows.map((r) => [r.teamId, r]))
  const candidates = subs
    .filter((s) => s.status === "submitted")
    .map((s) => ({
      id: s.teamId,
      label: `${teamName(s.teamId)}${s.name ? ` — ${s.name}` : ""}`,
      rank: rankOf.get(s.teamId)?.rank ?? 999,
      score: rankOf.get(s.teamId)?.score ?? null,
    }))
    .toSorted((a, b) => a.rank - b.rank)

  const results = event.results
  const suggested = leaderboard.rows.filter((r) => r.score !== null).slice(0, 3).map((r) => r.teamId)
  const stages: StageLabel[] = results
    ? buildStages(results).map((s) => {
        if (s.kind === "intro") return { label: "Intro", team: null }
        if (s.kind === "finale") return { label: "Finale — results released", team: null }
        if (s.kind === "place") return { label: PLACE[s.place] ?? `${s.place}th place`, team: teamName(s.teamId) }
        return { label: event.prizes.find((p) => p.id === s.prizeId)?.name ?? "Prize (removed)", team: teamName(s.teamId) }
      })
    : []
  const revealing = event.revealStage !== null

  return (
    <>
      <PageHeader title="Results & reveal" description="Lock the winners, run the reveal on the projector, then release results." />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="mr-2 font-mono text-primary">01</span>Lock results
            </CardTitle>
            <CardDescription>
              Prefilled from the leaderboard top 3 — double-check ties before locking. Locking closes judging.
            </CardDescription>
            <CardAction>{results ? <Badge>Locked</Badge> : <Badge variant="outline">Not locked</Badge>}</CardAction>
          </CardHeader>
          <CardContent>
            <ResultsLock
              candidates={candidates}
              prizes={event.prizes}
              locked={results}
              suggested={suggested}
              lockedNames={
                results
                  ? {
                      placements: results.placements
                        .toSorted((a, b) => a.place - b.place)
                        .map((p) => ({ label: PLACE[p.place] ?? `${p.place}th place`, team: teamName(p.teamId) })),
                      categories: results.categories.map((c) => ({
                        label: event.prizes.find((p) => p.id === c.prizeId)?.name ?? "Prize (removed)",
                        team: teamName(c.teamId),
                      })),
                    }
                  : null
              }
              canUnlock={!revealing && !event.resultsReleased}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="mr-2 font-mono text-primary">02</span>Reveal on the big screen
            </CardTitle>
            <CardDescription>
              Step through winners live. The projector only ever shows stages up to the current one.
            </CardDescription>
            <CardAction>
              {revealing ? <Badge>Live on screen</Badge> : <Badge variant="outline">Screen in normal mode</Badge>}
            </CardAction>
          </CardHeader>
          <CardContent>
            {results ? (
              <RevealControls stages={stages} current={event.revealStage} />
            ) : (
              <p className="text-muted-foreground">Lock results first.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="mr-2 font-mono text-primary">03</span>Release to participants
            </CardTitle>
            <CardDescription>
              Shows winners on everyone&apos;s Results page. Happens automatically when the reveal reaches the finale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReleaseToggle released={event.resultsReleased} disabled={!results} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
