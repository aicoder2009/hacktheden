"use client"

import { Award01Icon, DashboardSquare02Icon, HelpCircleIcon, SentIcon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardSquare02Icon },
  { href: "/team", label: "Team", icon: UserGroupIcon },
  { href: "/submission", label: "Submit", icon: SentIcon },
  { href: "/help", label: "Help", icon: HelpCircleIcon },
]

/** Participant bottom tab bar on phones (< sm). AppShell pads <main> so it never covers content. */
export function MobileNav({ resultsReleased = false }: { resultsReleased?: boolean }) {
  const path = usePathname()
  const tabs = resultsReleased ? [...TABS, { href: "/results", label: "Results", icon: Award01Icon }] : TABS
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className={cn("grid h-14", tabs.length === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {tabs.map((t) => {
          const active = path === t.href || path.startsWith(`${t.href}/`)
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:bg-muted",
                active && "text-primary before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:bg-primary"
              )}
            >
              <HugeiconsIcon icon={t.icon} strokeWidth={2} className="size-5" />
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
