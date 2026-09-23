import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { pageUser } from "@/lib/auth"
import { listTickets } from "@/lib/data"
import { HelpPanel } from "./help-panel"

export const metadata: Metadata = { title: "Help" }

export default async function HelpPage() {
  const user = await pageUser("participant")
  if (!user.teamId) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Ask a mentor" description="Get on a team first so mentors know where to find you." />
        <Link href="/team" className={buttonVariants()}>Create or join a team</Link>
      </div>
    )
  }
  const tickets = (await listTickets()).filter((t) => t.teamId === user.teamId).reverse()
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ask a mentor" description="Describe what you're stuck on and where you're sitting. A mentor will come to you." />
      <HelpPanel tickets={tickets} />
    </div>
  )
}
