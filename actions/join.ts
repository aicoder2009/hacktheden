"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { parse, run } from "@/lib/action"
import { AppError } from "@/lib/auth"
import { newId, newRejoinCode, normalizeCode } from "@/lib/codes"
import { getEvent, getUser, keys } from "@/lib/data"
import { getItem, isConditionFailure, transact, tx } from "@/lib/db"
import { createSession, destroySession } from "@/lib/session"
import type { User } from "@/lib/types"

const nameSchema = z.string().trim().min(2, "Enter your name").max(60)

/** Participants don't make accounts: name + the room code on the big screen is enough. */
export async function joinWithRoomCode(input: { name: string; code: string }) {
  return run(async () => {
    const name = parse(nameSchema, input.name)
    const event = await getEvent()
    if (normalizeCode(input.code) !== event.roomCode) {
      throw new AppError("That code doesn't match the one on the big screen.")
    }
    const now = new Date().toISOString()
    for (let attempt = 0; attempt < 3; attempt++) {
      const user: User = {
        id: `p-${newId()}`,
        name,
        email: "",
        role: "participant",
        verifiedAt: now,
        verifyFails: 0,
        rejoinCode: newRejoinCode(),
        createdAt: now,
      }
      try {
        await transact([
          tx.put(keys.user(user.id), user, "attribute_not_exists(PK)"),
          tx.put(keys.rejoin(user.rejoinCode!), { userId: user.id }, "attribute_not_exists(PK)"),
        ])
      } catch (e) {
        if (!isConditionFailure(e)) throw e
        continue // rejoin-code collision: try another
      }
      await createSession(user.id)
      revalidatePath("/", "layout")
      return { userId: user.id }
    }
    throw new AppError("Couldn't create your pass — please try again.")
  })
}

/** Get back in on another device with the personal code shown on the dashboard. */
export async function rejoinWithCode(rawCode: string) {
  return run(async () => {
    const code = normalizeCode(rawCode)
    const ref = code.length >= 8 ? await getItem<{ userId: string }>(keys.rejoin(code)) : undefined
    const user = ref && (await getUser(ref.userId))
    if (!user) throw new AppError("That rejoin code isn't right. Ask an officer if you've lost it.")
    await createSession(user.id)
    revalidatePath("/", "layout")
    return { userId: user.id }
  })
}

export async function leaveSession() {
  await destroySession()
  redirect("/")
}
