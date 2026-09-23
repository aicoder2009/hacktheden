import { getMe } from "@/lib/auth"
import { getEvent } from "@/lib/data"
import { isDemo } from "@/lib/demo/mode"
import type { Role } from "@/lib/types"
import { SiteHeader } from "./site-header"

export async function AppShell({ role, children }: { role?: Role; children: React.ReactNode }) {
  const [event, me] = await Promise.all([getEvent(), isDemo() ? getMe() : null])
  return (
    <>
      <SiteHeader role={role} eventName={event.name} demoUser={isDemo() ? (me?.name ?? null) : undefined}
        resultsReleased={event.resultsReleased}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </>
  )
}
