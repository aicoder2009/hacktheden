import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import { LeaveDialog } from "./leave-dialog"
import { NavLinks } from "./nav-links"

const NAV: Record<Role, { href: string; label: string }[]> = {
  participant: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/team", label: "Team" },
    { href: "/submission", label: "Submission" },
    { href: "/help", label: "Get help" },
  ],
  mentor: [{ href: "/mentor", label: "Help queue" }],
  judge: [{ href: "/judge", label: "Score projects" }],
  officer: [
    { href: "/admin", label: "Admin" },
    { href: "/judge", label: "Score projects" },
    { href: "/mentor", label: "Help queue" },
  ],
}

export function SiteHeader({
  role,
  eventName,
  demoUser,
  participant,
  resultsReleased = false,
}: {
  role?: Role
  eventName: string
  resultsReleased?: boolean
  /** Set in local demo mode: shows a user switcher instead of Clerk's account menu. */
  demoUser?: string | null
  /** Account-less participant (joined with the room code): show their name and a Leave button. */
  participant?: { name: string; rejoinCode?: string }
}) {
  // Participants get a bottom tab bar on phones (MobileNav), so the top row has room for the event name.
  const topNavOnMobile = !!role && role !== "participant"
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-heading text-sm font-semibold tracking-tight",
            topNavOnMobile ? "shrink-0" : "min-w-0 sm:shrink-0"
          )}
        >
          <span className="grid size-6 shrink-0 place-items-center bg-primary text-[10px] font-bold text-primary-foreground">
            DEN
          </span>
          <span className={cn("truncate sm:max-w-44 lg:max-w-64", topNavOnMobile && "hidden sm:block")}>{eventName}</span>
        </Link>
        {role && (
          <NavLinks
            className={topNavOnMobile ? undefined : "hidden sm:flex"}
            links={
              role === "participant" && resultsReleased
                ? [...NAV.participant, { href: "/results", label: "🏆 Results" }]
                : NAV[role]
            }
          />
        )}
        <div className="ml-auto shrink-0">
          {demoUser !== undefined ? (
            <Link href="/demo" className="flex items-center gap-2 text-xs whitespace-nowrap text-muted-foreground hover:text-foreground">
              <span className="bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary uppercase">Demo</span>
              <span className="hidden max-w-32 truncate lg:inline">{demoUser ?? "Not signed in"}</span>
              <span className="underline underline-offset-2">Switch user</span>
            </Link>
          ) : participant ? (
            <div className="flex items-center gap-2 text-xs whitespace-nowrap">
              <span className="hidden max-w-32 truncate text-muted-foreground lg:inline">{participant.name}</span>
              <LeaveDialog rejoinCode={participant.rejoinCode} />
            </div>
          ) : (
            <UserButton />
          )}
        </div>
      </div>
    </header>
  )
}
