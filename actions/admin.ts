"use server"

import { revalidatePath } from "next/cache"
import { parse, run } from "@/lib/action"
import { AppError, isSuperAdmin, requireRole } from "@/lib/auth"
import { newId, newScreenToken, randomCode } from "@/lib/codes"
import { getEvent, getTeam, getUser, keys, listScores, listTeams } from "@/lib/data"
import { deleteItem, putItem, updateItem } from "@/lib/db"
import { getKey, setKeyDisabled } from "@/lib/openrouter"
import { isFinale } from "@/lib/reveal"
import {
  announcementSchema,
  criteriaSchema,
  eventSettingsSchema,
  prizesSchema,
  resultsSchema,
  roleSchema,
  scheduleItemSchema,
} from "@/lib/schemas"
import type { Announcement, EventMeta, Role, ScheduleItem, Team, TeamAI } from "@/lib/types"

const officer = () => requireRole("officer")

async function setEvent(fields: Partial<EventMeta>) {
  await getEvent() // make sure META exists
  await updateItem("META", fields)
  revalidatePath("/", "layout")
}

// ── Event ────────────────────────────────────────────────────────────────

export async function updateEvent(input: unknown) {
  return run(async () => {
    await officer()
    await setEvent(parse(eventSettingsSchema, input))
    return null
  })
}

export async function regenerateRoomCode() {
  return run(async () => {
    await officer()
    const roomCode = randomCode()
    await setEvent({ roomCode })
    return { roomCode }
  })
}

export async function rotateScreenToken() {
  return run(async () => {
    await officer()
    const screenToken = newScreenToken()
    await setEvent({ screenToken })
    return { screenToken }
  })
}

// ── Users ────────────────────────────────────────────────────────────────

export async function setUserRole(userId: string, rawRole: Role) {
  return run(async () => {
    await officer()
    const role = parse(roleSchema, rawRole)
    const target = await getUser(userId)
    if (!target) throw new AppError("User not found.")
    if (isSuperAdmin(target.email)) throw new AppError("The super-admin is always an officer.")
    if (target.teamId && role !== "participant") throw new AppError("They're on a team — they need to leave it first.")
    await updateItem(keys.user(userId), { role })
    revalidatePath("/admin/users")
    return null
  })
}

export async function setUserVerified(userId: string, verified: boolean) {
  return run(async () => {
    await officer()
    const target = await getUser(userId)
    if (!target) throw new AppError("User not found.")
    if (verified) await updateItem(keys.user(userId), { verifiedAt: new Date().toISOString(), verifyFails: 0 })
    else if (target.teamId) throw new AppError("They're on a team — they need to leave it first.")
    else await updateItem(keys.user(userId), { verifyFails: 0 }, { remove: ["verifiedAt"] })
    revalidatePath("/admin/users")
    return null
  })
}

// ── Judging ──────────────────────────────────────────────────────────────

export async function updateRubric(input: unknown) {
  return run(async () => {
    await officer()
    const criteria = parse(criteriaSchema, input)
    if ((await listScores()).length > 0) throw new AppError("Judges have started scoring — the rubric is locked.")
    await setEvent({ criteria })
    return null
  })
}

export async function updatePrizes(input: unknown) {
  return run(async () => {
    await officer()
    const prizes = parse(prizesSchema, input)
    const { results } = await getEvent()
    if (results?.categories.some((c) => !prizes.some((p) => p.id === c.prizeId))) {
      throw new AppError("That prize has a locked winner — unlock results first.")
    }
    await setEvent({ prizes })
    return null
  })
}

// ── Results & reveal ─────────────────────────────────────────────────────

export async function lockResults(input: unknown) {
  return run(async () => {
    await officer()
    const results = parse(resultsSchema, input)
    await setEvent({ results, revealStage: null, resultsReleased: false })
    return null
  })
}

export async function unlockResults() {
  return run(async () => {
    await officer()
    const event = await getEvent()
    if (event.revealStage !== null || event.resultsReleased) throw new AppError("Stop the reveal first.")
    await setEvent({ results: null })
    return null
  })
}

/** `null` returns the screen to normal mode. Reaching the finale releases results. */
export async function setRevealStage(stage: number | null) {
  return run(async () => {
    await officer()
    const event = await getEvent()
    if (!event.results) throw new AppError("Lock results first.")
    const fields: Partial<EventMeta> = { revealStage: stage === null ? null : Math.max(0, stage) }
    if (stage !== null && isFinale(event.results, stage)) fields.resultsReleased = true
    await setEvent(fields)
    return null
  })
}

export async function setResultsReleased(released: boolean) {
  return run(async () => {
    await officer()
    if (released && !(await getEvent()).results) throw new AppError("Lock results first.")
    await setEvent({ resultsReleased: released })
    return null
  })
}

// ── Announcements & schedule ─────────────────────────────────────────────

export async function postAnnouncement(input: unknown) {
  return run(async () => {
    const user = await officer()
    const { body } = parse(announcementSchema, input)
    const now = new Date().toISOString()
    const ann: Announcement = { id: `${now}#${newId()}`, body, authorName: user.name, createdAt: now }
    await putItem(keys.ann(ann.id), ann)
    revalidatePath("/", "layout")
    return null
  })
}

export async function deleteAnnouncement(id: string) {
  return run(async () => {
    await officer()
    await deleteItem(keys.ann(id))
    revalidatePath("/", "layout")
    return null
  })
}

export async function upsertScheduleItem(input: unknown) {
  return run(async () => {
    await officer()
    const data = parse(scheduleItemSchema, input)
    const item: ScheduleItem = { ...data, id: data.id ?? newId() }
    await putItem(keys.sched(item.id), item)
    revalidatePath("/", "layout")
    return null
  })
}

export async function deleteScheduleItem(id: string) {
  return run(async () => {
    await officer()
    await deleteItem(keys.sched(id))
    revalidatePath("/", "layout")
    return null
  })
}

// ── AI keys ──────────────────────────────────────────────────────────────

async function applyKeyDisabled(team: Team, disabled: boolean) {
  if (team.ai?.status !== "active") return
  await setKeyDisabled(team.ai.hash, disabled)
  await updateItem(keys.team(team.id), { ai: { ...team.ai, disabled } satisfies TeamAI })
}

export async function setAiKeyDisabled(teamId: string, disabled: boolean) {
  return run(async () => {
    await officer()
    const team = await getTeam(teamId)
    if (!team) throw new AppError("Team not found.")
    await applyKeyDisabled(team, disabled)
    revalidatePath("/admin/teams")
    return null
  })
}

export async function disableAllAiKeys() {
  return run(async () => {
    await officer()
    const teams = await listTeams()
    await Promise.all(teams.map((t) => applyKeyDisabled(t, true)))
    revalidatePath("/admin/teams")
    return null
  })
}

export async function refreshAiUsage() {
  return run(async () => {
    await officer()
    const teams = (await listTeams()).filter((t) => t.ai?.status === "active")
    await Promise.all(
      teams.map(async (t) => {
        if (t.ai?.status !== "active") return
        const info = await getKey(t.ai.hash)
        await updateItem(keys.team(t.id), {
          ai: { ...t.ai, usageUsd: info.usage, disabled: info.disabled, usageAt: new Date().toISOString() } satisfies TeamAI,
        })
      })
    )
    revalidatePath("/admin/teams")
    return null
  })
}
