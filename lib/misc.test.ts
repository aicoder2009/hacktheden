import { describe, expect, it } from "vitest"
import { CODE_ALPHABET, formatRejoinCode, newRejoinCode, normalizeCode, randomCode } from "./codes"
import { buildStages, isFinale, visibleStages } from "./reveal"
import { currentAndNext } from "./schedule"
import { photoKeysValid, submissionFinalSchema } from "./schemas"
import type { Results } from "./types"

const results: Results = {
  placements: [
    { place: 1, teamId: "gold" },
    { place: 2, teamId: "silver" },
    { place: 3, teamId: "bronze" },
  ],
  categories: [{ prizeId: "best-ai", teamId: "ai-team" }],
}

describe("reveal", () => {
  it("orders intro → categories → 3rd, 2nd, 1st → finale", () => {
    const kinds = buildStages(results).map((s) => ("teamId" in s ? s.teamId : s.kind))
    expect(kinds).toEqual(["intro", "ai-team", "bronze", "silver", "gold", "finale"])
  })
  it("never includes unrevealed stages", () => {
    const v = visibleStages(results, 2)
    expect(v).toHaveLength(3)
    expect(JSON.stringify(v)).not.toContain("gold")
    expect(JSON.stringify(v)).not.toContain("silver")
  })
  it("shows nothing when the reveal hasn't started", () => {
    expect(visibleStages(results, null)).toEqual([])
    expect(visibleStages(null, 3)).toEqual([])
  })
  it("detects the finale", () => {
    expect(isFinale(results, 4)).toBe(false)
    expect(isFinale(results, 5)).toBe(true)
  })
  it("works with no categories", () => {
    expect(buildStages({ placements: [], categories: [] }).map((s) => s.kind)).toEqual(["intro", "finale"])
  })
})

describe("codes", () => {
  it("uses only unambiguous characters", () => {
    const code = randomCode(200)
    expect(code).toHaveLength(200)
    expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true)
    expect(code).not.toMatch(/[01OIL]/)
  })
  it("normalizes user input", () => {
    expect(normalizeCode(" abc-23 4 ")).toBe("ABC234")
  })
  it("rejoin codes are 8 chars and round-trip through display formatting", () => {
    const code = newRejoinCode()
    expect(code).toHaveLength(8)
    expect(formatRejoinCode(code)).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(normalizeCode(formatRejoinCode(code).toLowerCase())).toBe(code)
  })
})

describe("schedule", () => {
  const items = [
    { id: "1", title: "Kickoff", startsAt: "2026-11-14T09:00:00Z", endsAt: "2026-11-14T09:30:00Z", location: "" },
    { id: "2", title: "Hacking", startsAt: "2026-11-14T09:30:00Z", endsAt: null, location: "" },
    { id: "3", title: "Lunch", startsAt: "2026-11-14T12:00:00Z", endsAt: "2026-11-14T13:00:00Z", location: "" },
  ]
  it("finds current and next", () => {
    const r = currentAndNext(items, new Date("2026-11-14T10:00:00Z"))
    expect(r.current?.title).toBe("Hacking")
    expect(r.next?.title).toBe("Lunch")
  })
  it("handles before start and after an ended item", () => {
    expect(currentAndNext(items, new Date("2026-11-14T08:00:00Z")).current).toBeNull()
    const after = currentAndNext(items, new Date("2026-11-14T14:00:00Z"))
    expect(after.current).toBeNull()
    expect(after.next).toBeNull()
  })
})

describe("submission schema", () => {
  const valid = {
    name: "Rocket",
    tagline: "Fast",
    description: "A project that does something useful for people.",
    repoUrl: "https://github.com/basha/rocket",
    demoUrl: "",
    videoUrl: "https://youtu.be/xyz",
    photoKeys: [],
    consentPhotos: true,
    consentMit: true,
  }
  it("accepts a complete submission", () => {
    expect(submissionFinalSchema.safeParse(valid).success).toBe(true)
  })
  it("requires both consents", () => {
    expect(submissionFinalSchema.safeParse({ ...valid, consentMit: false }).success).toBe(false)
    expect(submissionFinalSchema.safeParse({ ...valid, consentPhotos: false }).success).toBe(false)
  })
  it("requires a GitHub repo URL", () => {
    expect(submissionFinalSchema.safeParse({ ...valid, repoUrl: "https://gitlab.com/a/b" }).success).toBe(false)
  })
  it("requires a demo or a video", () => {
    expect(submissionFinalSchema.safeParse({ ...valid, videoUrl: "" }).success).toBe(false)
  })
  it("checks photo keys stay under the team prefix", () => {
    expect(photoKeysValid(["events/e/teams/t/a.jpg"], "events/e/teams/t/")).toBe(true)
    expect(photoKeysValid(["events/e/teams/other/a.jpg"], "events/e/teams/t/")).toBe(false)
    expect(photoKeysValid(["events/e/teams/t/../x/a.jpg"], "events/e/teams/t/")).toBe(false)
  })
})
