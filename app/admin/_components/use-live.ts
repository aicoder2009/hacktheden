"use client"

import useSWR from "swr"
import type { LeaderboardData, ScreenData } from "@/lib/views"

export type LiveData = { stats: ScreenData["stats"]; leaderboard: LeaderboardData }

async function fetcher(url: string): Promise<LiveData> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Live data failed (${res.status})`)
  return res.json()
}

/** Officer live stats + leaderboard, polled every 5s. */
export function useLive(fallbackData: LiveData) {
  const { data, error } = useSWR("/api/admin/live", fetcher, { fallbackData, refreshInterval: 5000 })
  return { data: data ?? fallbackData, stale: !!error }
}
