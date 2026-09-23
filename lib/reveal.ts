import type { Results } from "./types"

export type Stage =
  | { kind: "intro" }
  | { kind: "category"; prizeId: string; teamId: string }
  | { kind: "place"; place: number; teamId: string }
  | { kind: "finale" }

/** Intro → prize categories → places counting down (3rd, 2nd, 1st) → finale. */
export function buildStages(results: Results): Stage[] {
  return [
    { kind: "intro" },
    ...results.categories.map((c) => ({ kind: "category" as const, ...c })),
    ...[...results.placements].sort((a, b) => b.place - a.place).map((p) => ({ kind: "place" as const, ...p })),
    { kind: "finale" },
  ]
}

/** Only stages up to and including `stage` — never leaks unrevealed winners. */
export function visibleStages(results: Results | null, stage: number | null): Stage[] {
  if (!results || stage === null || stage < 0) return []
  return buildStages(results).slice(0, stage + 1)
}

export function isFinale(results: Results, stage: number) {
  return stage >= buildStages(results).length - 1
}
