"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { AppError, DEMO_COOKIE, homeFor } from "@/lib/auth"
import { newId } from "@/lib/codes"
import { getUser, keys } from "@/lib/data"
import { putItem, updateItem } from "@/lib/db"
import { resetStore } from "@/lib/demo/memory-db"
import { isDemo } from "@/lib/demo/mode"
import type { User } from "@/lib/types"

function guard() {
  if (!isDemo()) throw new AppError("Demo mode is off.")
}

export async function signInAs(userId: string) {
  guard()
  const user = await getUser(userId)
  if (!user) throw new AppError("Unknown demo user.")
  ;(await cookies()).set(DEMO_COOKIE, userId, { path: "/", httpOnly: true, sameSite: "lax" })
  redirect(user.role === "participant" && !user.verifiedAt ? "/verify" : homeFor(user.role))
}

export async function newParticipant() {
  guard()
  const id = `demo-${newId()}`
  const user: User = {
    id,
    name: "New Participant",
    email: `${id}@example.com`,
    role: "participant",
    verifyFails: 0,
    createdAt: new Date().toISOString(),
  }
  await putItem(keys.user(id), user)
  ;(await cookies()).set(DEMO_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax" })
  redirect("/verify")
}

export async function signOut() {
  guard()
  ;(await cookies()).delete(DEMO_COOKIE)
  redirect("/demo")
}

/** Move the submission deadline relative to now (0 = end hacking now, opening judging). */
export async function setDeadline(minutesFromNow: number) {
  guard()
  await updateItem("META", { submissionDeadline: new Date(Date.now() + minutesFromNow * 60_000).toISOString() })
  revalidatePath("/", "layout")
}

export async function resetDemo() {
  guard()
  resetStore()
  ;(await cookies()).delete(DEMO_COOKIE)
  redirect("/demo")
}
