"use server"

import { run } from "@/lib/action"
import { AppError, requireVerifiedParticipant } from "@/lib/auth"
import { getEvent, getTeam, keys } from "@/lib/data"
import { isConditionFailure, updateItem } from "@/lib/db"
import { env } from "@/lib/env"
import { createKey } from "@/lib/openrouter"
import type { TeamAI } from "@/lib/types"

const PENDING_TIMEOUT_MS = 60_000

/** Creates the team's budget-capped OpenRouter key. A pending marker prevents duplicate keys. */
export async function claimAiKey() {
  return run(async () => {
    const user = await requireVerifiedParticipant()
    const team = user.teamId && (await getTeam(user.teamId))
    if (!team) throw new AppError("Join or create a team first.")
    if (team.ai?.status === "active") return null

    const now = new Date()
    try {
      await updateItem(keys.team(team.id), { ai: { status: "pending", at: now.toISOString() } satisfies TeamAI }, {
        condition: "attribute_not_exists(#ai) OR #ai.#at < :stale",
        names: { "#ai": "ai", "#at": "at" },
        values: { ":stale": new Date(now.getTime() - PENDING_TIMEOUT_MS).toISOString() },
      })
    } catch (e) {
      if (isConditionFailure(e)) throw new AppError("Your key is already being created — refresh in a moment.")
      throw e
    }

    const event = await getEvent()
    try {
      const { key, info } = await createKey(`launchpad-${env().EVENT_ID}-${team.name}-${team.id}`, event.aiBudgetUsd)
      const ai: TeamAI = {
        status: "active",
        hash: info.hash,
        key,
        limitUsd: event.aiBudgetUsd,
        disabled: false,
        usageUsd: 0,
        usageAt: new Date().toISOString(),
      }
      await updateItem(keys.team(team.id), { ai })
      return null
    } catch (e) {
      console.error("claimAiKey", e)
      await updateItem(keys.team(team.id), {}, { remove: ["ai"] })
      throw new AppError("Couldn't create your AI key right now — try again or ask an officer.")
    }
  })
}
