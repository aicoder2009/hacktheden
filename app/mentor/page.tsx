import { PageHeader } from "@/components/page-header"
import { pageUser } from "@/lib/auth"
import { listTickets } from "@/lib/data"
import { MentorQueue } from "./_components/mentor-queue"

export default async function MentorPage() {
  const [user, tickets] = await Promise.all([pageUser("mentor", "officer"), listTickets()])
  return (
    <>
      <PageHeader title="Help queue" description="Claim a request, go find the team, then mark it resolved." />
      <MentorQueue meId={user.id} initial={tickets} />
    </>
  )
}
