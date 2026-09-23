import type { EventMeta, Team, Ticket, TicketStatus, User } from "./types"

export const MAX_TEAM_SIZE = 4
export const MAX_VERIFY_FAILS = 10

/** Submissions and team changes lock at the deadline (inclusive). No deadline = never locked. */
export function isLocked(event: Pick<EventMeta, "submissionDeadline">, now: Date) {
  return !!event.submissionDeadline && now.getTime() >= new Date(event.submissionDeadline).getTime()
}

/** Judges score after hacking ends and until results are locked. */
export function canScore(event: Pick<EventMeta, "submissionDeadline" | "results">, now: Date) {
  return isLocked(event, now) && !event.results
}

type Ev = Pick<EventMeta, "submissionDeadline">

export function canCreateTeam(user: User, event: Ev, now: Date): string | null {
  if (user.role !== "participant") return "Only participants can be on a team."
  if (!user.verifiedAt) return "Verify with the room code first."
  if (user.teamId) return "You're already on a team."
  if (isLocked(event, now)) return "Team changes are locked."
  return null
}

export function canJoinTeam(user: User, team: Team, event: Ev, now: Date): string | null {
  return canCreateTeam(user, event, now) ?? (team.memberCount >= MAX_TEAM_SIZE ? "That team is full." : null)
}

/** Returns the team after `userId` leaves, or null when the team dissolves. */
export function teamAfterLeave(team: Team, userId: string): Team | null {
  const members = { ...team.members }
  delete members[userId]
  const ids = Object.keys(members)
  if (ids.length === 0) return null
  const captainId =
    team.captainId === userId
      ? ids.sort((a, b) => members[a].joinedAt.localeCompare(members[b].joinedAt))[0]
      : team.captainId
  return { ...team, members, memberCount: ids.length, captainId }
}

export function canLeaveTeam(user: User, event: Ev, now: Date): string | null {
  if (!user.teamId) return "You're not on a team."
  if (isLocked(event, now)) return "Team changes are locked."
  return null
}

export function canRemoveMember(team: Team, actorId: string, targetId: string, event: Ev, now: Date) {
  if (team.captainId !== actorId) return "Only the captain can remove members."
  if (actorId === targetId) return "Use “Leave team” instead."
  if (!team.members[targetId]) return "That person isn't on your team."
  if (isLocked(event, now)) return "Team changes are locked."
  return null
}

const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["claimed", "cancelled"],
  claimed: ["resolved", "open"],
  resolved: [],
  cancelled: [],
}

export function canTransitionTicket(from: TicketStatus, to: TicketStatus) {
  return TICKET_TRANSITIONS[from].includes(to)
}

export function isActiveTicket(t: Pick<Ticket, "status">) {
  return t.status === "open" || t.status === "claimed"
}
