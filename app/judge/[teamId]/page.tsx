import Link from "next/link"
import { notFound } from "next/navigation"
import { badgeVariants } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { pageUser } from "@/lib/auth"
import { getScore } from "@/lib/data"
import { presignMany } from "@/lib/s3"
import { cn } from "@/lib/utils"
import { judgingQueue, scoringClosedReason } from "../_components/queue"
import { ScoreForm } from "../_components/score-form"
import { ScoringBanner } from "../_components/scoring-banner"

export default async function JudgeTeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const user = await pageUser("judge", "officer")
  const { event, rows } = await judgingQueue()
  const idx = rows.findIndex((r) => r.sub.teamId === teamId)
  if (idx < 0) notFound()

  const { sub, team, teamName } = rows[idx]
  const [photos, myScore] = await Promise.all([presignMany(sub.photoKeys), getScore(teamId, user.id)])
  const prev = rows[idx - 1]
  const next = rows[idx + 1]
  const closed = scoringClosedReason(event)
  const links = [
    { label: "Repository", href: sub.repoUrl },
    { label: "Live demo", href: sub.demoUrl },
    { label: "Video", href: sub.videoUrl },
  ].filter((l) => l.href)
  const members = team ? Object.values(team.members).map((m) => m.name) : []

  return (
    <>
      <nav className="mb-4 flex items-center justify-between gap-2">
        <Link href="/judge" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          ← All projects
        </Link>
        <div className="flex items-center gap-1">
          <span className="mr-2 font-mono text-xs text-muted-foreground">
            {idx + 1} / {rows.length}
          </span>
          <NavLink team={prev} label="← Prev" />
          <NavLink team={next} label="Next →" />
        </div>
      </nav>

      <ScoringBanner reason={closed} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <article className="min-w-0 space-y-6">
          <header>
            <p className="font-mono text-xs tracking-widest text-primary uppercase">{teamName}</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">{sub.name || "Untitled project"}</h1>
            {sub.tagline && <p className="mt-1 text-sm text-muted-foreground">{sub.tagline}</p>}
          </header>

          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          )}

          <Section title="Description">
            <p className="text-sm/relaxed whitespace-pre-wrap">{sub.description || "No description."}</p>
          </Section>

          <div className="grid gap-6 sm:grid-cols-2">
            <Section title="Team">
              {members.length ? (
                <ul className="space-y-0.5 text-sm">
                  {members.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No members listed.</p>
              )}
            </Section>
            <Section title="AI tools used">
              {sub.aiTools.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sub.aiTools.map((t) => (
                    <span key={t} className={badgeVariants({ variant: "secondary" })}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {sub.aiToolsOther && <p className="mt-2 text-xs whitespace-pre-wrap">{sub.aiToolsOther}</p>}
              {!sub.aiTools.length && !sub.aiToolsOther && <p className="text-xs text-muted-foreground">None listed.</p>}
            </Section>
          </div>

          {photos.length > 0 && (
            <Section title={`Photos (${photos.length})`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-video overflow-hidden bg-muted ring-1 ring-foreground/10 transition hover:ring-primary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs */}
                    <img src={url} alt={`Photo ${i + 1}`} loading="lazy" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            </Section>
          )}
        </article>

        <aside className="lg:sticky lg:top-16 lg:self-start">
          <ScoreForm
            key={teamId}
            teamId={teamId}
            criteria={event.criteria}
            initial={myScore ? { scores: myScore.scores, notes: myScore.notes, savedAt: myScore.updatedAt } : null}
            disabled={closed !== null}
          />
        </aside>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  )
}

function NavLink({ team, label }: { team?: { sub: { teamId: string } }; label: string }) {
  if (!team) {
    return (
      <span aria-disabled className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-40")}>
        {label}
      </span>
    )
  }
  return (
    <Link href={`/judge/${team.sub.teamId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
      {label}
    </Link>
  )
}
