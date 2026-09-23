import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { pageUser } from "@/lib/auth"

export const metadata: Metadata = { title: "Help queue" }

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const user = await pageUser("mentor", "officer")
  return <AppShell role={user.role}>{children}</AppShell>
}
