"use client"

import Link from "next/link"
import useSWR from "swr"
import { Countdown } from "@/components/countdown"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fmtAgo, fmtTime } from "@/lib/format"
import { currentAndNext } from "@/lib/schedule"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/lib/views"
import { AiCard } from "../_components/ai-card"
import { NextSteps } from "../_components/next-steps"

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)))

export function DashboardView({ initial }: { initial: DashboardData }) {
  const { data = initial } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    fallbackData: initial,
    refreshInterval: 5000,
  })
  const { team, submission, ticket, event } = data
  const { current, next } = currentAndNext(data.schedule, new Date(data.now))

  return (
    <div className="space-y-6">
      {event.resultsReleased && (
        <Link
          href="/results"
          className="block border border-primary bg-primary/10 p-4 font-heading text-sm font-semibold text-primary hover:bg-primary/15"
        >
          🏆 Results are out — see the winners →
        </Link>
      )}

      <section className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Hey {data.me.name.split(" ")[0]} 👋</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{event.name}</h1>
          {current && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Now:</span> {current.title}
              {next && (
                <span className="text-muted-foreground">
                  {" "}
                  · Next: {next.title} at {fmtTime(next.startsAt)}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Submissions close in</div>
          <Countdown
            target={event.submissionDeadline}
            serverNow={data.now}
            doneLabel="Closed"
            className="font-mono text-3xl font-semibold"
          />
        </div>
      </section>

      <NextSteps data={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>{team ? `${team.memberCount} of 4 members` : "Teams of 1–4 people"}</CardDescription>
                {team && (
                  <CardAction>
                    <code className="bg-muted px-1.5 py-0.5 font-mono">{team.joinCode}</code>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {team ? (
                  <>
                    <div className="font-heading text-base font-semibold">{team.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(team.members).map(([id, m]) => (
                        <Badge key={id} variant="secondary">
                          {m.name}
                          {id === team.captainId && " ★"}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">You&apos;re not on a team yet. Start one or join with a code.</p>
                )}
                <Link href="/team" className={buttonVariants({ variant: team ? "outline" : "default", size: "sm" })}>
                  {team ? "Manage team" : "Create or join a team"}
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submission</CardTitle>
                <CardDescription>
                  {data.locked ? "Submissions are closed" : `Due ${fmtTime(event.submissionDeadline)}`}
                </CardDescription>
                <CardAction>
                  {submission?.status === "submitted" ? (
                    <Badge>Submitted</Badge>
                  ) : submission ? (
                    <Badge variant="outline">Draft</Badge>
                  ) : (
                    <Badge variant="outline">Not started</Badge>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className={cn(!submission?.name && "text-muted-foreground")}>
                  {submission?.name || (team ? "Nothing saved yet." : "Get on a team first.")}
                </p>
                {team && (
                  <Link href="/submission" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    {data.locked ? "View submission" : submission ? "Edit submission" : "Start submission"}
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {data.announcements.length === 0 ? (
                <p className="text-muted-foreground">Nothing yet — updates from the organizers show up here.</p>
              ) : (
                <ul className="divide-y">
                  {data.announcements.map((a) => (
                    <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                      <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {a.authorName} · {fmtAgo(a.createdAt, new Date(data.now).getTime())}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div id="ai" className="scroll-mt-16">
            <AiCard hasTeam={!!team} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
              <CardDescription>Mentors come to your table.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket && (ticket.status === "open" || ticket.status === "claimed") ? (
                <p>
                  {ticket.status === "open" ? "Waiting for a mentor…" : `${ticket.mentorName} is on the way.`}
                  <span className="block text-muted-foreground">“{ticket.topic}”</span>
                </p>
              ) : (
                <p className="text-muted-foreground">Stuck? Ask a mentor.</p>
              )}
              {team && (
                <Link href="/help" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {ticket && (ticket.status === "open" || ticket.status === "claimed") ? "View request" : "Request help"}
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {data.schedule.length === 0 ? (
                <p className="text-muted-foreground">Schedule coming soon.</p>
              ) : (
                <ol className="space-y-2">
                  {data.schedule.map((s) => (
                    <li key={s.id} className={cn("flex gap-3", current?.id === s.id && "font-semibold text-primary")}>
                      <span className="w-16 shrink-0 font-mono text-muted-foreground">{fmtTime(s.startsAt)}</span>
                      <span className="min-w-0">
                        {s.title}
                        {s.location && <span className="block font-normal text-muted-foreground">{s.location}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
