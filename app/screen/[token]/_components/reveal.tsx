import { cn } from "@/lib/utils"
import type { ScreenData } from "@/lib/views"

type Stage = NonNullable<ScreenData["reveal"]>[number]
type Winner = Extract<Stage, { title: string }>

const DRUMROLL_MS = 3000

/** Full-screen results takeover. The last stage is the current one; keyed so each new stage replays its animation. */
export function Reveal({ stages, eventName }: { stages: Stage[]; eventName: string }) {
  const idx = stages.length - 1
  const cur = stages[idx]
  const winners = stages.filter((s): s is Winner => "title" in s)
  // Places are revealed 3rd → 1st; recap them 1st first, then the prize categories.
  const recap = [...winners.filter((w) => w.kind === "place").reverse(), ...winners.filter((w) => w.kind === "category")]

  return (
    <div key={idx} className="relative flex min-h-svh flex-col items-center justify-center p-[4vw] text-center">
      {cur.kind === "intro" && (
        <>
          <p className="animate-in font-mono text-[1.4vw] tracking-[0.4em] text-primary uppercase duration-1000 fade-in">
            {eventName}
          </p>
          <h1 className="mt-[2vw] animate-in font-heading text-[8vw] leading-none font-bold tracking-tight duration-1000 fade-in zoom-in-95">
            And the winners are…
          </h1>
        </>
      )}
      {"title" in cur && <WinnerStage w={cur} />}
      {cur.kind === "finale" && <Finale winners={recap} />}
    </div>
  )
}

function WinnerStage({ w }: { w: Winner }) {
  const reveal = { animationDelay: `${DRUMROLL_MS}ms` }
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-in bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_65%)] duration-1000 fill-mode-both fade-in"
        style={reveal}
      />
      <p className="relative animate-in font-mono text-[1.4vw] tracking-[0.4em] text-muted-foreground uppercase duration-700 fade-in">
        {w.kind === "place" ? "Overall" : "Special prize"}
      </p>
      <h2 className="relative mt-[1vw] animate-in font-heading text-[6vw] leading-none font-bold tracking-tight duration-700 fade-in slide-in-from-top-4">
        {w.title}
      </h2>

      <div className="relative mt-[4vw] grid w-full place-items-center">
        {/* Drumroll: bounces, then fades out just before the winner appears. */}
        <div
          aria-hidden
          className="flex animate-out flex-col items-center gap-[1.5vw] duration-500 fill-mode-forwards fade-out [grid-area:1/1]"
          style={{ animationDelay: `${DRUMROLL_MS - 400}ms` }}
        >
          <div className="flex gap-[1.5vw]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[2vw] animate-bounce bg-primary" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <span className="animate-pulse font-mono text-[1.2vw] tracking-[0.4em] text-muted-foreground uppercase">
            Drumroll
          </span>
        </div>

        <div
          className={cn(
            "flex animate-in items-center gap-[3vw] duration-700 fill-mode-both fade-in zoom-in-95 slide-in-from-bottom-4 [grid-area:1/1]",
            w.photo ? "text-left" : "flex-col"
          )}
          style={reveal}
        >
          {w.photo && (
            // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL
            <img
              src={w.photo}
              alt={w.project || w.teamName}
              className="max-h-[45vh] max-w-[38vw] object-cover ring-4 ring-primary"
            />
          )}
          <div className="min-w-0">
            <div
              className={cn(
                "font-heading leading-[0.95] font-bold tracking-tight text-balance text-primary",
                w.photo ? "text-[5vw]" : "text-[7vw]"
              )}
            >
              {w.teamName}
            </div>
            {w.project && <div className="mt-[1vw] text-[3vw] leading-tight font-semibold">{w.project}</div>}
            {w.tagline && <div className="mt-[0.6vw] text-[1.8vw] text-muted-foreground">{w.tagline}</div>}
            {w.members.length > 0 && (
              <div className="mt-[1.5vw] font-mono text-[1.3vw] text-foreground/80">{w.members.join(" · ")}</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Finale({ winners }: { winners: Winner[] }) {
  return (
    <>
      <h1 className="animate-in font-heading text-[6vw] leading-none font-bold tracking-tight text-balance duration-1000 fade-in zoom-in-95">
        Congratulations to all teams!
      </h1>
      {winners.length > 0 && (
        <ul
          className={cn(
            "mt-[3vw] grid w-full max-w-[85vw] gap-px border bg-border text-left",
            winners.length > 5 && "grid-cols-2"
          )}
        >
          {winners.map((w, i) => (
            <li
              key={i}
              className="flex min-w-0 animate-in items-baseline gap-[1.5vw] bg-background px-[1.5vw] py-[1vw] duration-700 fill-mode-both fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${600 + i * 150}ms` }}
            >
              <span className="w-[12vw] shrink-0 truncate font-mono text-[1vw] text-primary uppercase">{w.title}</span>
              <span className="shrink-0 font-heading text-[1.9vw] font-semibold">{w.teamName}</span>
              <span className="truncate text-[1.2vw] text-muted-foreground">{w.project}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
