import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvent, listScores } from "@/lib/data"
import { canScore } from "@/lib/rules"
import { buildLeaderboard, buildStats } from "@/lib/views"
import { LiveLeaderboard } from "../_components/live-leaderboard"
import { PrizesEditor } from "../_components/prizes-editor"
import { RubricEditor } from "../_components/rubric-editor"

export const metadata = { title: "Judging" }

export default async function JudgingPage() {
  const [event, scores, stats, leaderboard] = await Promise.all([getEvent(), listScores(), buildStats(), buildLeaderboard()])
  const rubricLocked = scores.length > 0
  const scoringOpen = canScore(event, new Date())
  return (
    <>
      <PageHeader title="Judging" description="Rubric, prize categories and the live leaderboard.">
        <Badge variant={scoringOpen ? "default" : "outline"}>
          {scoringOpen ? "Scoring open" : event.results ? "Results locked — scoring closed" : "Scoring opens at the deadline"}
        </Badge>
      </PageHeader>
      <div className="grid gap-6">
        <LiveLeaderboard fallback={{ stats, leaderboard }} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rubric</CardTitle>
              <CardDescription>
                Judges score each criterion 1–10. A team&apos;s score is the weighted mean, averaged across judges.
              </CardDescription>
              {rubricLocked && (
                <CardAction>
                  <Badge variant="secondary">Locked</Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <RubricEditor criteria={event.criteria} locked={rubricLocked} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Prize categories</CardTitle>
              <CardDescription>Extra awards beyond 1st–3rd. Pick winners on the Results page.</CardDescription>
            </CardHeader>
            <CardContent>
              <PrizesEditor prizes={event.prizes} resultsLocked={!!event.results} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
