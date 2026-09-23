import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import type { Role } from "@/lib/types"
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
  resultsReleased = false,
}: {
  role?: Role
  eventName: string
  resultsReleased?: boolean
  /** Set in local demo mode: shows a user switcher instead of Clerk's account menu. */
  demoUser?: string | null
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight">
          <span className="grid size-6 place-items-center bg-primary text-[10px] font-bold text-primary-foreground">
            LP
          </span>
          <span className="hidden sm:inline">{eventName}</span>
        </Link>
        {role && (
          <NavLinks
            links={
              role === "participant" && resultsReleased
                ? [...NAV.participant, { href: "/results", label: "🏆 Results" }]
                : NAV[role]
            }
          />
        )}
        <div className="ml-auto">
          {demoUser !== undefined ? (
            <Link href="/demo" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <span className="bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary uppercase">Demo</span>
              <span className="hidden sm:inline">{demoUser ?? "Not signed in"}</span>
              <span className="underline underline-offset-2">Switch user</span>
            </Link>
          ) : (
            <UserButton />
          )}
        </div>
      </div>
    </header>
  )
}
