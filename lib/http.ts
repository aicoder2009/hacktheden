import { NextResponse } from "next/server"
import { AppError } from "./auth"

/** Route-handler wrapper: JSON result, AppError → 403, anything else → 500. */
export async function json<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn(), { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: 403 })
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
