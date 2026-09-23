import type { z } from "zod"
import { AppError } from "./auth"
import { isConditionFailure } from "./db"

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

/** Wrap a server action body so expected errors become `{ ok: false, error }`. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message }
    if (isConditionFailure(e)) return { ok: false, error: "Something changed at the same time — please try again." }
    console.error(e)
    return { ok: false, error: "Something went wrong. Please try again." }
  }
}

export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const res = schema.safeParse(input)
  if (!res.success) throw new AppError(res.error.issues[0]?.message ?? "Invalid input")
  return res.data
}
