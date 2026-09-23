import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { pageUser } from "@/lib/auth"
import { getEvent, getTeam, publicTeam } from "@/lib/data"
import { isLocked } from "@/lib/rules"
import { TeamPanel } from "./team-panel"

export const metadata: Metadata = { title: "Team" }

export default async function TeamPage() {
  const user = await pageUser("participant")
  const [event, team] = await Promise.all([getEvent(), user.teamId ? getTeam(user.teamId) : undefined])
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Your team"
        description="Teams are 1–4 people. Going solo is fine. Changes lock when submissions close."
      />
      <TeamPanel meId={user.id} team={team ? publicTeam(team) : null} locked={isLocked(event, new Date())} />
    </div>
  )
}
