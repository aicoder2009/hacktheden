import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { pageUser } from "@/lib/auth"

export const metadata: Metadata = { title: "Judging" }

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const user = await pageUser("judge", "officer")
  return <AppShell role={user.role}>{children}</AppShell>
}
