import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { newParticipant, resetDemo, setDeadline, signInAs, signOut } from "@/actions/demo"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { getMe } from "@/lib/auth"
import { getEvent, listTeams, listUsers } from "@/lib/data"
import { isDemo } from "@/lib/demo/mode"
import { fmtDateTime } from "@/lib/format"
import { isLocked } from "@/lib/rules"
import type { Role, User } from "@/lib/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Demo" }

const GROUPS: { role: Role; title: string; hint: string }[] = [
  { role: "officer", title: "Officer", hint: "Runs everything in /admin" },
  { role: "judge", title: "Judges", hint: "Score projects once hacking ends" },
  { role: "mentor", title: "Mentors", hint: "Work the help queue" },
  { role: "participant", title: "Participants", hint: "Check in, team up, submit" },
]

export default async function DemoPage() {
  if (!isDemo()) notFound()
  const [me, users, teams, event] = await Promise.all([getMe(), listUsers(), listTeams(), getEvent()])
  const teamName = (u: User) => teams.find((t) => t.id === u.teamId)?.name
  const locked = isLocked(event, new Date())

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="font-mono text-xs tracking-widest text-primary uppercase">Local demo mode</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Pick who you are</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Everything runs on this machine with sample data. Nothing touches AWS, Clerk or OpenRouter. Switch people any
        time from the <span className="font-medium text-foreground">Switch user</span> link in the header. Open the
        projector screen in a second tab to watch it update live.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={`/screen/${event.screenToken}`} target="_blank" className={buttonVariants()}>
          Open projector screen ↗
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Landing page
        </Link>
        {me && (
          <form action={signOut}>
            <Button variant="ghost" type="submit">Sign out ({me.name})</Button>
          </form>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.role} className={cn("border p-4", g.role === "participant" && "md:row-span-3")}>
            <h2 className="font-heading text-sm font-semibold">{g.title}</h2>
            <p className="text-xs text-muted-foreground">{g.hint}</p>
            <ul className="mt-3 space-y-1">
              {users
                .filter((u) => u.role === g.role)
                .sort((a, b) => (teamName(a) ?? "~").localeCompare(teamName(b) ?? "~"))
                .map((u) => (
                  <li key={u.id}>
                    <form action={signInAs.bind(null, u.id)}>
                      <button
                        type="submit"
                        className={cn(
                          "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted",
                          me?.id === u.id && "bg-primary/10 ring-1 ring-primary"
                        )}
                      >
                        <span className="font-medium">{u.name}</span>
                        {g.role === "participant" &&
                          (u.teamId ? (
                            <Badge variant="secondary">{teamName(u)}</Badge>
                          ) : u.verifiedAt ? (
                            <Badge variant="outline">checked in · no team</Badge>
                          ) : (
                            <Badge variant="outline">not checked in</Badge>
                          ))}
                        {me?.id === u.id && <span className="ml-auto text-xs text-primary">you</span>}
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
            {g.role === "participant" && (
              <form action={newParticipant} className="mt-3">
                <Button variant="outline" size="sm" type="submit">+ New participant (try check-in from scratch)</Button>
              </form>
            )}
          </section>
        ))}

        <section className="border p-4">
          <h2 className="font-heading text-sm font-semibold">Time machine</h2>
          <p className="text-xs text-muted-foreground">
            Deadline: {fmtDateTime(event.submissionDeadline)} · {locked ? "hacking is over, judging open" : "hacking in progress"}.
            Room code on the big screen: <code className="font-mono text-foreground">{event.roomCode}</code>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={setDeadline.bind(null, 0)}>
              <Button size="sm" type="submit" disabled={locked}>End hacking now → judging</Button>
            </form>
            <form action={setDeadline.bind(null, 120)}>
              <Button size="sm" variant="outline" type="submit">Deadline in 2h</Button>
            </form>
            <form action={setDeadline.bind(null, 1)}>
              <Button size="sm" variant="outline" type="submit">Deadline in 1 min</Button>
            </form>
          </div>
          <form action={resetDemo} className="mt-4 border-t pt-3">
            <Button size="sm" variant="destructive" type="submit">Reset all demo data</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
