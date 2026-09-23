import { AppShell } from "@/components/app-shell"
import { pageUser } from "@/lib/auth"
import { AdminNav } from "./_components/admin-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await pageUser("officer")
  return (
    <AppShell role="officer">
      <div className="grid gap-6 lg:grid-cols-[11rem_1fr] lg:gap-10">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </AppShell>
  )
}
