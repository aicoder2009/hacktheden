import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listSubmissions, listTeams } from "@/lib/data"
import { presignMany } from "@/lib/s3"
import { LocalTime } from "../_components/local-time"
import { SubmissionBadge } from "../_components/submission-badge"

export const metadata = { title: "Submissions" }

export default async function SubmissionsPage() {
  const [subs, teams] = await Promise.all([listSubmissions(), listTeams()])
  const teamName = new Map(teams.map((t) => [t.id, t.name]))
  const sorted = subs.toSorted(
    (a, b) => (a.status === b.status ? 0 : a.status === "submitted" ? -1 : 1) || b.updatedAt.localeCompare(a.updatedAt)
  )
  const photos = await Promise.all(sorted.map((s) => presignMany(s.photoKeys)))
  const submitted = subs.filter((s) => s.status === "submitted").length

  return (
    <>
      <PageHeader
        title="Submissions"
        description={`${submitted} submitted · ${subs.length - submitted} drafts · ${Math.max(0, teams.length - subs.length)} teams haven't started`}
      />
      {sorted.length === 0 && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
      <div className="grid gap-4">
        {sorted.map((s, i) => {
          const links = [
            { label: "Repo", href: s.repoUrl },
            { label: "Demo", href: s.demoUrl },
            { label: "Video", href: s.videoUrl },
          ].filter((l) => /^https?:\/\//i.test(l.href)) // drafts aren't URL-validated; never link javascript:/data:
          return (
            <Card key={s.teamId} size="sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionBadge status={s.status} />
                  <span className="text-muted-foreground">{teamName.get(s.teamId) ?? "Unknown team"}</span>
                </div>
                <CardTitle className="text-base">{s.name || <span className="text-muted-foreground">Untitled project</span>}</CardTitle>
                {s.tagline && <CardDescription>{s.tagline}</CardDescription>}
              </CardHeader>
              <CardContent className="grid gap-3">
                {s.description && (
                  <details>
                    <summary className="cursor-pointer text-muted-foreground select-none">Description</summary>
                    <p className="mt-2 whitespace-pre-wrap">{s.description}</p>
                  </details>
                )}
                {links.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {links.map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 truncate text-primary underline-offset-4 hover:underline"
                      >
                        {l.label}: {l.href}
                      </a>
                    ))}
                  </div>
                )}
                {photos[i].length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos[i].map((url, j) => (
                      <a key={s.photoKeys[j]} href={url} target="_blank" rel="noreferrer" className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs, no image config */}
                        <img src={url} alt={`${s.name || "Project"} photo ${j + 1}`} className="size-20 object-cover ring-1 ring-foreground/10" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 text-[11px] text-muted-foreground">
                  {s.firstSubmittedAt && (
                    <span>
                      First submitted <LocalTime iso={s.firstSubmittedAt} />
                    </span>
                  )}
                  <span>
                    Updated <LocalTime iso={s.updatedAt} />
                  </span>
                  {s.consentPhotos && <span>Photo release ✓</span>}
                  {s.consentMit && <span>MIT ✓</span>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
