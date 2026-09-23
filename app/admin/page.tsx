import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { getEvent } from "@/lib/data"
import { buildLeaderboard, buildStats } from "@/lib/views"
import { AccessCard } from "./_components/access-card"
import { OverviewLive } from "./_components/overview-live"

export const metadata = { title: "Admin" }

const QUICK = [
  { href: "/admin/event", title: "Event", body: "Times, deadline, AI budget" },
  { href: "/admin/users", title: "People", body: "Roles and verification" },
  { href: "/admin/teams", title: "Teams", body: "Members and AI keys" },
  { href: "/admin/submissions", title: "Submissions", body: "Projects and photos" },
  { href: "/admin/judging", title: "Judging", body: "Rubric, prizes, leaderboard" },
  { href: "/admin/results", title: "Results & reveal", body: "Lock winners, run the reveal" },
  { href: "/admin/announcements", title: "Announcements", body: "Post to dashboards and screen" },
  { href: "/admin/schedule", title: "Schedule", body: "Agenda for the day" },
]

export default async function AdminOverview() {
  const [event, stats, leaderboard] = await Promise.all([getEvent(), buildStats(), buildLeaderboard()])
  return (
    <>
      <PageHeader title="Overview" description="Live numbers refresh every 5 seconds." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <OverviewLive fallback={{ stats, leaderboard }} />
        <AccessCard roomCode={event.roomCode} screenToken={event.screenToken} />
      </div>
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-sm font-semibold">Manage</h2>
        <div className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className="bg-background p-4 transition-colors hover:bg-muted">
              <div className="font-heading text-sm font-semibold">{q.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{q.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
