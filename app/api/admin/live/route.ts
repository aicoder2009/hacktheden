import { requireRole } from "@/lib/auth"
import { json } from "@/lib/http"
import { buildLeaderboard, buildStats } from "@/lib/views"

export const GET = () =>
  json(async () => {
    await requireRole("officer")
    const [stats, leaderboard] = await Promise.all([buildStats(), buildLeaderboard()])
    return { stats, leaderboard }
  })
