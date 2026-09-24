import {
  getEvent,
  getSubmission,
  getTeam,
  listAnnouncements,
  listSchedule,
  listScores,
  listSubmissions,
  listTeams,
  listTickets,
  listUsers,
  publicTeam,
} from "./data"
import { isActiveTicket, isLocked } from "./rules"
import { visibleStages, type Stage } from "./reveal"
import { presignGet } from "./s3"
import { currentAndNext } from "./schedule"
import { judgeScore, rankTeams } from "./scoring"
import type { EventMeta, Submission, Team, User } from "./types"

/** Event fields safe to show any signed-in user (no room code / screen token / results). */
export function publicEvent(e: EventMeta) {
  return {
    name: e.name,
    startsAt: e.startsAt,
    submissionDeadline: e.submissionDeadline,
    endsAt: e.endsAt,
    lumaUrl: e.lumaUrl,
    aiBudgetUsd: e.aiBudgetUsd,
    resultsReleased: e.resultsReleased,
  }
}

export async function buildDashboard(user: User) {
  const [event, announcements, schedule, tickets] = await Promise.all([
    getEvent(),
    listAnnouncements(10),
    listSchedule(),
    listTickets(),
  ])
  const team = user.teamId ? await getTeam(user.teamId) : undefined
  const submission = team ? await getSubmission(team.id) : undefined
  return {
    now: new Date().toISOString(),
    me: { id: user.id, name: user.name, verified: !!user.verifiedAt, rejoinCode: user.rejoinCode ?? null },
    event: publicEvent(event),
    locked: isLocked(event, new Date()),
    team: team ? publicTeam(team) : null,
    submission: submission ? { status: submission.status, name: submission.name, updatedAt: submission.updatedAt } : null,
    ticket: team ? (tickets.filter((t) => t.teamId === team.id).at(-1) ?? null) : null,
    announcements,
    schedule,
  }
}
export type DashboardData = Awaited<ReturnType<typeof buildDashboard>>

async function winnerCard(team: Team | undefined, sub: Submission | undefined) {
  return {
    teamName: team?.name ?? "Unknown team",
    members: team ? Object.values(team.members).map((m) => m.name) : [],
    project: sub?.name ?? "",
    tagline: sub?.tagline ?? "",
    photo: sub?.photoKeys[0] ? await presignGet(sub.photoKeys[0]) : null,
  }
}

async function revealView(event: EventMeta, stages: Stage[]) {
  const [teams, subs] = await Promise.all([listTeams(), listSubmissions()])
  return Promise.all(
    stages.map(async (s) => {
      if (s.kind === "intro" || s.kind === "finale") return { kind: s.kind }
      const card = await winnerCard(
        teams.find((t) => t.id === s.teamId),
        subs.find((x) => x.teamId === s.teamId)
      )
      const title =
        s.kind === "place"
          ? (["", "1st place", "2nd place", "3rd place"][s.place] ?? `${s.place}th place`)
          : (event.prizes.find((p) => p.id === s.prizeId)?.name ?? "Prize")
      return { kind: s.kind, title, ...card }
    })
  )
}

/** Live counts for the big screen and admin overview. */
export async function buildStats() {
  const [users, teams, subs, tickets] = await Promise.all([listUsers(), listTeams(), listSubmissions(), listTickets()])
  return {
    verified: users.filter((u) => u.role === "participant" && u.verifiedAt).length,
    teams: teams.length,
    submissions: subs.filter((s) => s.status === "submitted").length,
    openTickets: tickets.filter(isActiveTicket).length,
  }
}
export type Stats = Awaited<ReturnType<typeof buildStats>>

export async function buildScreen() {
  const event = await getEvent()
  const now = new Date()
  const [stats, schedule, announcements] = await Promise.all([buildStats(), listSchedule(), listAnnouncements(1)])
  const revealing = event.revealStage !== null && !!event.results
  return {
    serverNow: now.toISOString(),
    name: event.name,
    startsAt: event.startsAt,
    deadline: event.submissionDeadline,
    roomCode: event.roomCode,
    ...currentAndNext(schedule, now),
    announcement: announcements[0] ?? null,
    stats,
    reveal: revealing ? await revealView(event, visibleStages(event.results, event.revealStage)) : null,
  }
}
export type ScreenData = Awaited<ReturnType<typeof buildScreen>>

/** Released results for participants (all stages). */
export async function buildResults() {
  const event = await getEvent()
  if (!event.resultsReleased || !event.results) return null
  const stages = visibleStages(event.results, Number.MAX_SAFE_INTEGER)
  return (await revealView(event, stages)).flatMap((s) => ("teamName" in s ? [s] : []))
}

export async function buildLeaderboard() {
  const [event, subs, scores, teams, users] = await Promise.all([
    getEvent(),
    listSubmissions(),
    listScores(),
    listTeams(),
    listUsers(),
  ])
  const submitted = subs.filter((s) => s.status === "submitted")
  const ranked = rankTeams(event.criteria, scores, submitted)
  const judges = users.filter((u) => u.role === "judge")
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "?"
  const projectName = (id: string) => subs.find((s) => s.teamId === id)?.name ?? ""
  return {
    criteria: event.criteria,
    rows: ranked.map((r) => ({ ...r, teamName: teamName(r.teamId), project: projectName(r.teamId) })),
    judgeProgress: judges.map((j) => ({
      id: j.id,
      name: j.name,
      scored: scores.filter(
        (s) =>
          s.judgeId === j.id &&
          submitted.some((x) => x.teamId === s.teamId) &&
          judgeScore(event.criteria, s.scores) !== null
      ).length,
      total: submitted.length,
    })),
  }
}
export type LeaderboardData = Awaited<ReturnType<typeof buildLeaderboard>>
