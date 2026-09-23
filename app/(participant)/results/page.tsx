import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { buildResults } from "@/lib/views"

export const metadata: Metadata = { title: "Results" }

export default async function ResultsPage() {
  const results = await buildResults()
  if (!results) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Results"
          description="Winners are revealed live at the closing ceremony. Check back after!"
        />
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Results"
        description="Congratulations to every team that shipped something today."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((r, i) => (
          <article key={i} className="overflow-hidden border">
            {r.photo && (
              // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL
              <img
                src={r.photo}
                alt=""
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="space-y-1 p-4">
              <div className="font-mono text-xs tracking-widest text-primary uppercase">
                {r.title}
              </div>
              <div className="font-heading text-lg font-semibold">
                {r.teamName}
              </div>
              {r.project && (
                <div className="text-sm">
                  {r.project}
                  {r.tagline && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {r.tagline}
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {r.members.join(", ")}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
