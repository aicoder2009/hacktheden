"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

/** `exact` links only highlight on their own path (e.g. an "Overview" tab whose href prefixes its siblings). */
export function NavLinks({
  links,
  exact = [],
  className,
}: {
  links: { href: string; label: string }[]
  exact?: string[]
  className?: string
}) {
  const path = usePathname()
  return (
    <nav className={cn("-mx-1 flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]", className)}>
      {links.map((l) => {
        const active = path === l.href || (!exact.includes(l.href) && path.startsWith(`${l.href}/`))
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 px-2 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-muted text-foreground"
            )}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
