import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { isLocked } from "@/lib/rules"
import type { EventMeta } from "@/lib/types"
import { cn } from "@/lib/utils"

const PHASES = ["Set up", "Hacking", "Judging", "Reveal", "Done"] as const
type Phase = (typeof PHASES)[number]

export function eventPhase(event: EventMeta, now: Date): Phase {
  if (!event.submissionDeadline) return "Set up"
  if (!isLocked(event, now)) return "Hacking"
  if (!event.results) return "Judging"
  if (!event.resultsReleased) return "Reveal"
  return "Done"
}

const NEXT: Record<Phase, { title: string; body: string; actions: { href: string; label: string }[] }> = {
  "Set up": {
    title: "Finish setting up the event",
    body: "Set the submission deadline — it drives the countdown, locks submissions and opens judging. Then add the schedule and promote judges and mentors.",
    actions: [
      { href: "/admin/event", label: "Event settings" },
      { href: "/admin/schedule", label: "Schedule" },
      { href: "/admin/users", label: "People & roles" },
    ],
  },
  Hacking: {
    title: "Hacking is underway",
    body: "Keep the projector screen up, post announcements, and keep an eye on the help queue.",
    actions: [
      { href: "/admin/announcements", label: "Post an announcement" },
      { href: "/mentor", label: "Help queue" },
    ],
  },
  Judging: {
    title: "Submissions are closed — judges are scoring",
    body: "Watch judge progress below. When everyone is done, lock the winners.",
    actions: [
      { href: "/admin/judging", label: "Rubric & leaderboard" },
      { href: "/admin/results", label: "Lock the winners" },
    ],
  },
  Reveal: {
    title: "Winners are locked — time for the reveal",
    body: "Put the projector screen up, then step through the reveal. Reaching the finale publishes results to everyone.",
    actions: [{ href: "/admin/results", label: "Run the reveal" }],
  },
  Done: {
    title: "Results are public 🎉",
    body: "Participants can see the winners on their Results page. Disable the AI keys when you wrap up.",
    actions: [{ href: "/admin/teams", label: "Teams & AI keys" }],
  },
}

export function PhaseBanner({ event }: { event: EventMeta }) {
  const phase = eventPhase(event, new Date())
  const idx = PHASES.indexOf(phase)
  const next = NEXT[phase]
  return (
    <section className="border bg-card">
      <ol className="flex overflow-x-auto border-b text-[11px]">
        {PHASES.map((p, i) => (
          <li
            key={p}
            className={cn(
              "flex flex-1 items-center gap-1.5 px-3 py-2 whitespace-nowrap text-muted-foreground",
              i < idx && "text-foreground",
              i === idx && "bg-primary text-primary-foreground"
            )}
          >
            <span className="font-mono">{i < idx ? "✓" : i + 1}</span>
            {p}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-end justify-between gap-4 p-4">
        <div className="max-w-xl">
          <h2 className="font-heading text-base font-semibold">{next.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{next.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {next.actions.map((a, i) => (
            <Link key={a.href} href={a.href} className={buttonVariants({ variant: i === 0 ? "default" : "outline" })}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
