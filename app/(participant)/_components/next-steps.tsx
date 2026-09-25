import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/lib/views"

/** The participant's path through the day, with the next thing to do highlighted. */
export function NextSteps({ data }: { data: DashboardData }) {
  const { team, submission, locked, aiEnabled } = data
  const steps = [
    { label: "Check in", done: true, href: "/dashboard", cta: "" },
    { label: "Join a team", done: !!team, href: "/team", cta: "Create or join a team" },
    ...(aiEnabled ? [{ label: "Get your AI key", done: team?.ai?.status === "active", href: "#ai", cta: "Get your AI key" }] : []),
    { label: "Submit your project", done: submission?.status === "submitted", href: "/submission", cta: submission ? "Finish your submission" : "Start your submission" },
  ]
  const next = locked ? undefined : steps.find((s) => !s.done)

  return (
    <section className="border bg-card">
      <ol className={cn("grid grid-cols-2 border-b text-xs", steps.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-muted-foreground",
              s.done && "text-foreground",
              s === next && "bg-primary/10 font-medium text-primary"
            )}
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center border font-mono text-[10px]",
                s.done && "border-primary bg-primary text-primary-foreground",
                s === next && "border-primary"
              )}
            >
              {s.done ? "✓" : i + 1}
            </span>
            {s.label}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm">
          {locked
            ? "Submissions are closed. Nice work — judges are looking at projects now."
            : next
              ? <>Next up: <span className="font-medium">{next.label.toLowerCase()}</span>.</>
              : "You're all set. Keep building — you can edit your submission until the deadline."}
        </p>
        {next && (
          <Link href={next.href} className={buttonVariants()}>
            {next.cta} →
          </Link>
        )}
      </div>
    </section>
  )
}
