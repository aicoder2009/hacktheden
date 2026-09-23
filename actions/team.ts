"use server"

import { revalidatePath } from "next/cache"
import { parse, run } from "@/lib/action"
import { AppError, requireRole, requireVerifiedParticipant } from "@/lib/auth"
import { newId, normalizeCode, randomCode } from "@/lib/codes"
import { getEvent, getTeam, getUser, keys } from "@/lib/data"
import { getItem, isConditionFailure, transact, tx } from "@/lib/db"
import { deleteKey } from "@/lib/openrouter"
import { MAX_TEAM_SIZE, canCreateTeam, canJoinTeam, canLeaveTeam, canRemoveMember, teamAfterLeave } from "@/lib/rules"
import { teamNameSchema } from "@/lib/schemas"
import type { Team } from "@/lib/types"

const JOIN_USER = "attribute_not_exists(teamId) AND attribute_exists(verifiedAt)"

export async function createTeam(rawName: string) {
  return run(async () => {
    const user = await requireVerifiedParticipant()
    const err = canCreateTeam(user, await getEvent(), new Date())
    if (err) throw new AppError(err)
    const name = parse(teamNameSchema, rawName)
    const now = new Date().toISOString()

    for (let attempt = 0; attempt < 3; attempt++) {
      const team: Team = {
        id: newId(),
        name,
        joinCode: randomCode(),
        captainId: user.id,
        members: { [user.id]: { name: user.name, joinedAt: now } },
        memberCount: 1,
        version: 1,
        createdAt: now,
      }
      try {
        await transact([
          tx.put(keys.join(team.joinCode), { teamId: team.id }, "attribute_not_exists(PK)"),
          tx.put(keys.team(team.id), team, "attribute_not_exists(PK)"),
          tx.update(keys.user(user.id), "SET teamId = :t", { condition: JOIN_USER, values: { ":t": team.id } }),
        ])
        revalidatePath("/", "layout")
        return { teamId: team.id }
      } catch (e) {
        if (!isConditionFailure(e)) throw e
        if ((await getUser(user.id))?.teamId) throw new AppError("You're already on a team.")
        // Otherwise a join-code collision: retry with a new code.
      }
    }
    throw new AppError("Couldn't create the team — please try again.")
  })
}

export async function joinTeam(rawCode: string) {
  return run(async () => {
    const user = await requireVerifiedParticipant()
    const join = await getItem<{ teamId: string }>(keys.join(normalizeCode(rawCode)))
    const team = join && (await getTeam(join.teamId))
    if (!team) throw new AppError("No team has that code.")
    const err = canJoinTeam(user, team, await getEvent(), new Date())
    if (err) throw new AppError(err)

    await transact([
      tx.update(keys.team(team.id), "SET #m.#u = :m, #c = #c + :one, #v = #v + :one", {
        condition: "#v = :v AND #c < :max",
        names: { "#m": "members", "#u": user.id, "#c": "memberCount", "#v": "version" },
        values: {
          ":m": { name: user.name, joinedAt: new Date().toISOString() },
          ":one": 1,
          ":v": team.version,
          ":max": MAX_TEAM_SIZE,
        },
      }),
      tx.update(keys.user(user.id), "SET teamId = :t", { condition: JOIN_USER, values: { ":t": team.id } }),
    ])
    revalidatePath("/", "layout")
    return { teamId: team.id }
  })
}

/** Writes the team after `userId` is gone (or deletes it) and clears that user's teamId. */
async function removeFromTeam(team: Team, userId: string) {
  const next = teamAfterLeave(team, userId)
  const clearUser = tx.update(keys.user(userId), "REMOVE teamId", {
    condition: "teamId = :t",
    values: { ":t": team.id },
  })
  if (!next) {
    await transact([
      tx.del(keys.team(team.id)),
      tx.del(keys.join(team.joinCode)),
      tx.del(keys.sub(team.id)),
      clearUser,
    ])
    if (team.ai?.status === "active") await deleteKey(team.ai.hash).catch((e) => console.error("deleteKey", e))
    return
  }
  await transact([
    tx.update(keys.team(team.id), "SET #m = :m, #c = :c, #cap = :cap, #v = #v + :one", {
      condition: "#v = :v",
      names: { "#m": "members", "#c": "memberCount", "#cap": "captainId", "#v": "version" },
      values: { ":m": next.members, ":c": next.memberCount, ":cap": next.captainId, ":one": 1, ":v": team.version },
    }),
    clearUser,
  ])
}

export async function leaveTeam() {
  return run(async () => {
    const user = await requireRole("participant")
    const err = canLeaveTeam(user, await getEvent(), new Date())
    if (err) throw new AppError(err)
    const team = await getTeam(user.teamId!)
    if (!team) throw new AppError("Team not found.")
    await removeFromTeam(team, user.id)
    revalidatePath("/", "layout")
    return null
  })
}

export async function removeMember(targetId: string) {
  return run(async () => {
    const user = await requireVerifiedParticipant()
    const team = user.teamId && (await getTeam(user.teamId))
    if (!team) throw new AppError("You're not on a team.")
    const err = canRemoveMember(team, user.id, targetId, await getEvent(), new Date())
    if (err) throw new AppError(err)
    await removeFromTeam(team, targetId)
    revalidatePath("/", "layout")
    return null
  })
}
