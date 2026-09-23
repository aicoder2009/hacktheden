import { AppShell } from "@/components/app-shell"
import { NavLinks } from "@/components/nav-links"
import { pageUser } from "@/lib/auth"

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/event", label: "Event" },
  { href: "/admin/users", label: "People" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/judging", label: "Judging" },
  { href: "/admin/results", label: "Results & reveal" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/schedule", label: "Schedule" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await pageUser("officer")
  return (
    <AppShell role="officer">
      <div className="-mt-2 mb-6 border-b pb-2">
        <NavLinks links={LINKS} exact={["/admin"]} />
      </div>
      {children}
    </AppShell>
  )
}
