import { describe, expect, it } from "vitest"
import { ANNOUNCEMENT_FRESH_MS, ANNOUNCEMENT_TAKEOVER_MS, announcementState, bodyScale } from "./announcements"

const sentAt = "2026-11-14T18:00:00.000Z"
const sent = new Date(sentAt).getTime()
const ann = { createdAt: sentAt }

describe("announcementState", () => {
  it("takes over the screen right after a post is sent", () => {
    expect(announcementState(ann, sent)).toBe("takeover")
    expect(announcementState(ann, sent + ANNOUNCEMENT_TAKEOVER_MS - 1)).toBe("takeover")
  })

  it("stays new after the takeover ends", () => {
    expect(announcementState(ann, sent + ANNOUNCEMENT_TAKEOVER_MS)).toBe("fresh")
    expect(announcementState(ann, sent + ANNOUNCEMENT_FRESH_MS - 1)).toBe("fresh")
  })

  it("settles once it is old news", () => {
    expect(announcementState(ann, sent + ANNOUNCEMENT_FRESH_MS)).toBe("settled")
    expect(announcementState(ann, sent + 24 * 3600_000)).toBe("settled")
  })

  it("treats a post from a slightly-ahead server clock as brand new", () => {
    expect(announcementState(ann, sent - 5_000)).toBe("takeover")
  })

  it("is settled with no post at all", () => {
    expect(announcementState(null, sent)).toBe("settled")
    expect(announcementState(undefined, sent)).toBe("settled")
  })
})

describe("bodyScale", () => {
  it("goes huge for one-liners and shrinks as the post gets longer", () => {
    expect(bodyScale("Pizza is here!")).toBe("xl")
    expect(bodyScale("x".repeat(60))).toBe("xl")
    expect(bodyScale("x".repeat(61))).toBe("lg")
    expect(bodyScale("x".repeat(140))).toBe("lg")
    expect(bodyScale("x".repeat(141))).toBe("md")
    expect(bodyScale("x".repeat(280))).toBe("md")
    expect(bodyScale("x".repeat(281))).toBe("sm")
    expect(bodyScale("x".repeat(500))).toBe("sm")
  })

  it("ignores surrounding whitespace", () => {
    expect(bodyScale("   short   \n")).toBe("xl")
  })
})
