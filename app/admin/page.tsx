import { PageHeader } from "@/components/page-header"
import { getEvent } from "@/lib/data"
import { buildLeaderboard, buildStats } from "@/lib/views"
import { AccessCard } from "./_components/access-card"
import { OverviewLive } from "./_components/overview-live"
import { PhaseBanner } from "./_components/phase-banner"

export const metadata = { title: "Admin" }

export default async function AdminOverview() {
  const [event, stats, leaderboard] = await Promise.all([getEvent(), buildStats(), buildLeaderboard()])
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Live numbers refresh every 5 seconds." />
      <PhaseBanner event={event} />
      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <OverviewLive fallback={{ stats, leaderboard }} />
        <AccessCard roomCode={event.roomCode} screenToken={event.screenToken} />
      </div>
    </div>
  )
}
