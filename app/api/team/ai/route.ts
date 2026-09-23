import { requireVerifiedParticipant } from "@/lib/auth"
import { getTeam, keys } from "@/lib/data"
import { updateItem } from "@/lib/db"
import { json } from "@/lib/http"
import { getKey } from "@/lib/openrouter"
import type { TeamAI } from "@/lib/types"

const USAGE_TTL_MS = 60_000

/** The team's raw key + usage. Members only — the only place the key ever leaves the server. */
export const GET = () =>
  json(async () => {
    const user = await requireVerifiedParticipant()
    const team = user.teamId ? await getTeam(user.teamId) : undefined
    let ai = team?.ai
    if (!team || !ai) return { ai: null }
    if (ai.status === "active" && Date.now() - new Date(ai.usageAt).getTime() > USAGE_TTL_MS) {
      try {
        const info = await getKey(ai.hash)
        ai = { ...ai, usageUsd: info.usage, disabled: info.disabled, usageAt: new Date().toISOString() } satisfies TeamAI
        await updateItem(keys.team(team.id), { ai })
      } catch (e) {
        console.error("usage refresh", e)
      }
    }
    return { ai }
  })
