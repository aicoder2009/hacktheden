"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { parse, run } from "@/lib/action"
import { AppError, requireRole } from "@/lib/auth"
import { normalizeCode } from "@/lib/codes"
import { getEvent, keys } from "@/lib/data"
import { updateItem } from "@/lib/db"
import { MAX_VERIFY_FAILS } from "@/lib/rules"

const nameSchema = z.string().trim().min(2, "Enter your name").max(60)

export async function verifyRoomCode(input: { name: string; code: string }) {
  return run(async () => {
    const user = await requireRole("participant")
    if (user.verifiedAt) return null
    if (user.verifyFails >= MAX_VERIFY_FAILS) {
      throw new AppError("Too many attempts — ask an officer to check you in.")
    }
    const name = parse(nameSchema, input.name)
    const event = await getEvent()
    if (normalizeCode(input.code) !== event.roomCode) {
      await updateItem(keys.user(user.id), { verifyFails: user.verifyFails + 1 })
      throw new AppError("That code doesn't match the one on the big screen.")
    }
    await updateItem(keys.user(user.id), { verifiedAt: new Date().toISOString(), name })
    revalidatePath("/", "layout")
    return null
  })
}
