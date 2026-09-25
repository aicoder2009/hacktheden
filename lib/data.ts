import { cache } from "react"
import { newScreenToken, randomCode } from "./codes"
import { getItem, isConditionFailure, putItem, queryPrefix } from "./db"
import { sortSchedule } from "./schedule"
import type { Announcement, EventMeta, ScheduleItem, Score, Submission, Team, Ticket, User } from "./types"

export const keys = {
  user: (id: string) => `USER#${id}`,
  team: (id: string) => `TEAM#${id}`,
  join: (code: string) => `JOIN#${code}`,
  sub: (teamId: string) => `SUB#${teamId}`,
  score: (teamId: string, judgeId: string) => `SCORE#${teamId}#${judgeId}`,
  ann: (id: string) => `ANN#${id}`,
  sched: (id: string) => `SCHED#${id}`,
  ticket: (id: string) => `TICKET#${id}`,
  session: (hash: string) => `SESSION#${hash}`,
  rejoin: (code: string) => `REJOIN#${code}`,
}

function defaultEvent(): EventMeta {
  return {
    name: "Hack the Den",
    startsAt: "2026-11-14T16:00:00.000Z", // Sat Nov 14, 9:00 AM Arizona — edit in Admin → Event settings
    submissionDeadline: null,
    endsAt: null,
    lumaUrl: "https://luma.com/61q0tpoz",
    roomCode: randomCode(),
    screenToken: newScreenToken(),
    aiBudgetUsd: 5,
    criteria: [
      { id: "innovation", name: "Innovation", description: "How original is the idea?", weight: 1 },
      { id: "technical", name: "Technical execution", description: "Does it work? How hard was it?", weight: 1 },
      { id: "ai", name: "Use of AI", description: "How effectively did the team build with AI?", weight: 1 },
      { id: "design", name: "Design & UX", description: "Is it pleasant and easy to use?", weight: 1 },
      { id: "presentation", name: "Presentation", description: "How well did they demo and explain it?", weight: 1 },
    ],
    prizes: [],
    results: null,
    revealStage: null,
    resultsReleased: false,
  }
}

/** The current event's META item; created with defaults on first read. */
export const getEvent = cache(async (): Promise<EventMeta> => {
  const existing = await getItem<EventMeta>("META")
  if (existing) return existing
  const fresh = defaultEvent()
  try {
    await putItem("META", fresh, { ifNotExists: true })
    return fresh
  } catch (e) {
    if (!isConditionFailure(e)) throw e
    return (await getItem<EventMeta>("META"))!
  }
})

export const getUser = (id: string) => getItem<User>(keys.user(id))
export const getTeam = (id: string) => getItem<Team>(keys.team(id))
export const getSubmission = (teamId: string) => getItem<Submission>(keys.sub(teamId))
export const getScore = (teamId: string, judgeId: string) => getItem<Score>(keys.score(teamId, judgeId))

export const listUsers = () => queryPrefix<User>("USER#")
export const listTeams = () => queryPrefix<Team>("TEAM#")
export const listSubmissions = () => queryPrefix<Submission>("SUB#")
export const listScores = () => queryPrefix<Score>("SCORE#")
export const listTickets = () => queryPrefix<Ticket>("TICKET#")
export const listAnnouncements = (limit?: number) =>
  queryPrefix<Announcement>("ANN#", { newestFirst: true, limit })
export const listSchedule = async () => sortSchedule(await queryPrefix<ScheduleItem>("SCHED#"))

/** Strip the secret key before sending a team anywhere but its own members' AI card. */
export function publicTeam(team: Team) {
  const { ai, ...rest } = team
  return {
    ...rest,
    ai: ai?.status === "active" ? { status: ai.status, disabled: ai.disabled, usageUsd: ai.usageUsd, limitUsd: ai.limitUsd } : ai ? { status: ai.status } : undefined,
  }
}
export type PublicTeam = ReturnType<typeof publicTeam>
