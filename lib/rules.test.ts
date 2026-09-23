import { describe, expect, it } from "vitest"
import {
  canCreateTeam,
  canJoinTeam,
  canRemoveMember,
  canScore,
  canTransitionTicket,
  isLocked,
  teamAfterLeave,
} from "./rules"
import type { Team, User } from "./types"

const deadline = "2026-11-14T20:00:00.000Z"
const event = { submissionDeadline: deadline, results: null }
const before = new Date("2026-11-14T19:59:59.999Z")
const at = new Date(deadline)

const user = (over: Partial<User> = {}): User => ({
  id: "u1",
  name: "U",
  email: "u@x.com",
  role: "participant",
  verifiedAt: "2026-11-14T09:00:00Z",
  verifyFails: 0,
  createdAt: "",
  ...over,
})

const team = (memberIds: string[], captainId = memberIds[0]): Team => ({
  id: "t",
  name: "T",
  joinCode: "ABC234",
  captainId,
  members: Object.fromEntries(memberIds.map((id, i) => [id, { name: id, joinedAt: `2026-11-14T09:0${i}:00Z` }])),
  memberCount: memberIds.length,
  version: 1,
  createdAt: "",
})

describe("deadline", () => {
  it("locks at the deadline, inclusive", () => {
    expect(isLocked(event, before)).toBe(false)
    expect(isLocked(event, at)).toBe(true)
  })
  it("never locks without a deadline", () => {
    expect(isLocked({ submissionDeadline: null }, at)).toBe(false)
  })
  it("allows scoring only after lock and before results", () => {
    expect(canScore(event, before)).toBe(false)
    expect(canScore(event, at)).toBe(true)
    expect(canScore({ ...event, results: { placements: [], categories: [] } }, at)).toBe(false)
  })
})

describe("team rules", () => {
  it("allows a verified participant to create a solo team", () => {
    expect(canCreateTeam(user(), event, before)).toBeNull()
  })
  it("rejects unverified, staff, already-teamed, and locked", () => {
    expect(canCreateTeam(user({ verifiedAt: undefined }), event, before)).toMatch(/Verify/)
    expect(canCreateTeam(user({ role: "judge" }), event, before)).toMatch(/participants/)
    expect(canCreateTeam(user({ teamId: "x" }), event, before)).toMatch(/already/)
    expect(canCreateTeam(user(), event, at)).toMatch(/locked/)
  })
  it("rejects joining a full team", () => {
    expect(canJoinTeam(user(), team(["a", "b", "c"]), event, before)).toBeNull()
    expect(canJoinTeam(user(), team(["a", "b", "c", "d"]), event, before)).toMatch(/full/)
  })
  it("passes captaincy to the earliest member on leave", () => {
    const next = teamAfterLeave(team(["a", "b", "c"]), "a")!
    expect(next.captainId).toBe("b")
    expect(next.memberCount).toBe(2)
    expect(next.members.a).toBeUndefined()
  })
  it("keeps the captain when someone else leaves", () => {
    expect(teamAfterLeave(team(["a", "b"]), "b")!.captainId).toBe("a")
  })
  it("dissolves when the last member leaves", () => {
    expect(teamAfterLeave(team(["a"]), "a")).toBeNull()
  })
  it("lets only the captain remove others", () => {
    const t = team(["a", "b"])
    expect(canRemoveMember(t, "a", "b", event, before)).toBeNull()
    expect(canRemoveMember(t, "b", "a", event, before)).toMatch(/captain/)
    expect(canRemoveMember(t, "a", "a", event, before)).toMatch(/Leave/)
    expect(canRemoveMember(t, "a", "z", event, before)).toMatch(/isn't/)
  })
})

describe("tickets", () => {
  it("follows the allowed transitions", () => {
    expect(canTransitionTicket("open", "claimed")).toBe(true)
    expect(canTransitionTicket("claimed", "resolved")).toBe(true)
    expect(canTransitionTicket("claimed", "open")).toBe(true)
    expect(canTransitionTicket("open", "resolved")).toBe(false)
    expect(canTransitionTicket("resolved", "open")).toBe(false)
  })
})
