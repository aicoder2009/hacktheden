import type { Metadata } from "next"
import { pageUser } from "@/lib/auth"
import { buildDashboard } from "@/lib/views"
import { DashboardView } from "./dashboard-view"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const user = await pageUser("participant")
  return <DashboardView initial={await buildDashboard(user)} />
}
