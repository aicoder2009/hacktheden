import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { homeFor, pageUser } from "@/lib/auth"

/** Participant area: requires a checked-in participant. */
export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const user = await pageUser()
  if (user.role !== "participant") redirect(homeFor(user.role))
  if (!user.verifiedAt) redirect("/verify")
  return <AppShell role="participant">{children}</AppShell>
}
