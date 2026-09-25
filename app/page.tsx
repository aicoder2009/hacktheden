import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { getMe } from "@/lib/auth"
import { getEvent } from "@/lib/data"
import { fmtDay } from "@/lib/format"
import { cn } from "@/lib/utils"

export default async function Landing() {
  const [isAuthenticated, event] = await Promise.all([
    getMe().then(Boolean),
    getEvent(),
  ])
  const date = event.startsAt
    ? fmtDay(event.startsAt, "long")
    : "Saturday, November 14"

  const steps = [
    { n: "01", title: "RSVP on Luma", body: "Grab your spot so we know you're coming." },
    { n: "02", title: "Show up", body: "No account needed — just bring a laptop and your ideas." },
    { n: "03", title: "Join with the room code", body: "Type your name and the code on the big screen. Then form a team (1–4) and get your AI budget." },
  ]

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <div className="relative mx-auto flex min-h-svh max-w-5xl flex-col px-4 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading text-sm font-semibold">
            <span className="grid size-6 place-items-center bg-primary text-[10px] font-bold text-primary-foreground">
              DEN
            </span>
            Basha DevOps Club
          </div>
          {isAuthenticated ? (
            <Link href="/home" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open app
            </Link>
          ) : (
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Staff sign in
            </Link>
          )}
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="font-mono text-xs tracking-widest text-primary uppercase">
            {date} · In person · One day
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-[0.95] font-bold tracking-tight text-balance sm:text-7xl">
            {event.name}
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            The Basha DevOps Club&apos;s one-day AI-coding hackathon. Build something real with AI coding tools — every
            team gets its own AI budget, mentors are on hand, and the best projects win.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link href="/home" className={cn(buttonVariants({ size: "lg" }), "px-5")}>
                Go to your dashboard →
              </Link>
            ) : (
              <Link href="/join" className={cn(buttonVariants({ size: "lg" }), "px-5")}>
                Join with the room code →
              </Link>
            )}
            {event.lumaUrl && (
              <a href={event.lumaUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-5")}>
                RSVP on Luma
              </a>
            )}
          </div>
        </section>

        <section className="grid gap-px border bg-border sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-5">
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <div className="mt-2 font-heading text-sm font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>
        <footer className="py-6 text-xs text-muted-foreground">
          All projects are released under the MIT license. Build in the open.
        </footer>
      </div>
    </main>
  )
}
