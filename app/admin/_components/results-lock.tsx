"use client"

import { useState } from "react"
import { lockResults, unlockResults } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { useAction } from "@/components/use-action"
import type { Prize, Results } from "@/lib/types"
import { NativeSelect } from "./native-select"

type Candidate = { id: string; label: string; rank: number; score: number | null }
type Named = { label: string; team: string }

const PLACES = [
  { place: 1, label: "1st place" },
  { place: 2, label: "2nd place" },
  { place: 3, label: "3rd place" },
]

export function ResultsLock({
  candidates,
  prizes,
  locked,
  suggested,
  lockedNames,
  canUnlock,
}: {
  candidates: Candidate[]
  prizes: Prize[]
  locked: Results | null
  suggested: string[]
  lockedNames: { placements: Named[]; categories: Named[] } | null
  canUnlock: boolean
}) {
  const { pending, exec } = useAction()
  const [places, setPlaces] = useState<string[]>(() =>
    PLACES.map((p, i) => locked?.placements.find((x) => x.place === p.place)?.teamId ?? (locked ? "" : (suggested[i] ?? "")))
  )
  const [cats, setCats] = useState<Record<string, string>>(() =>
    Object.fromEntries(prizes.map((p) => [p.id, locked?.categories.find((c) => c.prizeId === p.id)?.teamId ?? ""]))
  )

  if (locked && lockedNames) {
    return (
      <div className="grid gap-4">
        <WinnerList items={[...lockedNames.placements, ...lockedNames.categories]} />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pending || !canUnlock}
            onClick={() => {
              if (!window.confirm("Unlock results? Judges will be able to score again.")) return
              void exec(unlockResults, { success: "Results unlocked" })
            }}
          >
            Unlock to edit
          </Button>
          {!canUnlock && (
            <span className="text-[11px] text-muted-foreground">Exit the reveal and un-release results before unlocking.</span>
          )}
        </div>
      </div>
    )
  }

  const chosen = places.filter(Boolean)
  const duplicate = new Set(chosen).size !== chosen.length

  function lock() {
    const placements = PLACES.map((p, i) => ({ place: p.place, teamId: places[i] })).filter((p) => p.teamId)
    const categories = prizes.map((p) => ({ prizeId: p.id, teamId: cats[p.id] ?? "" })).filter((c) => c.teamId)
    if (!window.confirm("Lock these results? Judging closes and the winners are fixed until you unlock.")) return
    void exec(() => lockResults({ placements, categories }), { success: "Results locked" })
  }

  const option = (c: Candidate) => (
    <option key={c.id} value={c.id}>
      {c.rank < 999 ? `#${c.rank} ` : ""}
      {c.label}
      {c.score !== null ? ` (${c.score.toFixed(2)})` : ""}
    </option>
  )

  return (
    <div className="grid gap-4">
      {candidates.length === 0 && <p className="text-muted-foreground">No submitted projects yet.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {PLACES.map((p, i) => (
          <label key={p.place} className="grid gap-1.5">
            <span className="font-medium">{p.label}</span>
            <NativeSelect
              value={places[i]}
              onChange={(e) => setPlaces(places.map((v, j) => (j === i ? e.target.value : v)))}
            >
              <option value="">— none —</option>
              {candidates.map(option)}
            </NativeSelect>
          </label>
        ))}
      </div>
      {prizes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {prizes.map((p) => (
            <label key={p.id} className="grid gap-1.5">
              <span className="font-medium">{p.name}</span>
              <NativeSelect value={cats[p.id] ?? ""} onChange={(e) => setCats({ ...cats, [p.id]: e.target.value })}>
                <option value="">— skip —</option>
                {candidates.map(option)}
              </NativeSelect>
            </label>
          ))}
        </div>
      )}
      {duplicate && <p className="text-destructive">The same team is in more than one place.</p>}
      <div>
        <Button onClick={lock} disabled={pending || duplicate || (chosen.length === 0 && !Object.values(cats).some(Boolean))}>
          {pending ? "Locking…" : "Lock results"}
        </Button>
      </div>
    </div>
  )
}

function WinnerList({ items }: { items: Named[] }) {
  return (
    <dl className="grid gap-px border bg-border sm:grid-cols-3">
      {items.map((w, i) => (
        <div key={i} className="bg-background p-3">
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{w.label}</dt>
          <dd className="mt-1 font-heading text-sm font-semibold">{w.team}</dd>
        </div>
      ))}
    </dl>
  )
}
