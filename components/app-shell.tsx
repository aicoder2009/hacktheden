import { auth } from "@clerk/nextjs/server"
import { getMe } from "@/lib/auth"
import { formatRejoinCode } from "@/lib/codes"
import { getEvent } from "@/lib/data"
import { isDemo } from "@/lib/demo/mode"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MobileNav } from "./mobile-nav"
import { SiteHeader } from "./site-header"

export async function AppShell({ role, children }: { role?: Role; children: React.ReactNode }) {
  const [event, me, clerk] = await Promise.all([getEvent(), getMe(), isDemo() ? null : auth()])
  const accountless =
    !isDemo() && me && !clerk?.userId
      ? { name: me.name, rejoinCode: me.rejoinCode ? formatRejoinCode(me.rejoinCode) : undefined }
      : undefined
  const tabBar = role === "participant"
  return (
    <>
      <SiteHeader role={role} eventName={event.name} demoUser={isDemo() ? (me?.name ?? null) : undefined}
        participant={accountless}
        resultsReleased={event.resultsReleased}
      />
      <main
        className={cn(
          "mx-auto w-full max-w-6xl px-4 py-6 sm:py-8",
          // Clear the fixed bottom tab bar (h-14 + safe area) on phones.
          tabBar && "pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-8"
        )}
      >
        {children}
      </main>
      {tabBar && <MobileNav resultsReleased={event.resultsReleased} />}
    </>
  )
}
