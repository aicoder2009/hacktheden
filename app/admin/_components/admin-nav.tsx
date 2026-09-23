"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

/** Grouped in the order officers need them over the course of the event. */
const GROUPS = [
  { title: null, links: [{ href: "/admin", label: "Overview" }] },
  {
    title: "Before",
    links: [
      { href: "/admin/event", label: "Event settings" },
      { href: "/admin/schedule", label: "Schedule" },
      { href: "/admin/users", label: "People & roles" },
    ],
  },
  {
    title: "During",
    links: [
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/teams", label: "Teams & AI keys" },
      { href: "/admin/submissions", label: "Submissions" },
    ],
  },
  {
    title: "Awards",
    links: [
      { href: "/admin/judging", label: "Rubric & leaderboard" },
      { href: "/admin/results", label: "Results & reveal" },
    ],
  },
]

export function AdminNav() {
  const path = usePathname()
  const isActive = (href: string) => (href === "/admin" ? path === href : path === href || path.startsWith(`${href}/`))

  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto border-b px-4 pb-2 lg:mx-0 lg:overflow-visible lg:border-0 lg:px-0 lg:pb-0">
      <div className="flex gap-4 lg:sticky lg:top-18 lg:flex-col lg:gap-5">
        {GROUPS.map((g, i) => (
          <div key={i} className="flex shrink-0 items-center gap-1 lg:flex-col lg:items-stretch lg:gap-0.5">
            {g.title && (
              <div className="hidden px-2 pb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase lg:block">
                {g.title}
              </div>
            )}
            {g.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn(
                  "shrink-0 px-2 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive(l.href) && "bg-muted text-foreground lg:shadow-[inset_2px_0_0_var(--primary)]"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
