import { auth, currentUser } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getItem, isConditionFailure, putItem, updateItem } from "./db"
import { keys } from "./data"
import { isDemo } from "./demo/mode"
import { superAdminEmails } from "./env"
import type { Role, User } from "./types"

/** Thrown for expected failures; `run()` turns it into `{ ok: false, error }`. */
export class AppError extends Error {}

export const DEMO_COOKIE = "demo_uid"

export const isSuperAdmin = (email: string) => superAdminEmails().includes(email.toLowerCase())

/** The signed-in user's DB record, created on first visit. Super-admins are always officers. */
export const getMe = cache(async (): Promise<User | null> => {
  // Demo mode: "sign in" by picking a sample user on /demo (stored in a cookie).
  if (isDemo()) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value
    return id ? ((await getItem<User>(keys.user(id))) ?? null) : null
  }

  const { userId } = await auth()
  if (!userId) return null

  let user = await getItem<User>(keys.user(userId))
  if (!user) {
    const cu = await currentUser()
    const email = cu?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? ""
    const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.username || email.split("@")[0]
    user = { id: userId, name, email, role: "participant", verifyFails: 0, createdAt: new Date().toISOString() }
    try {
      await putItem(keys.user(userId), user, { ifNotExists: true })
    } catch (e) {
      if (!isConditionFailure(e)) throw e
      user = (await getItem<User>(keys.user(userId)))!
    }
  }

  if (user.role !== "officer" && isSuperAdmin(user.email)) {
    await updateItem(keys.user(userId), { role: "officer" })
    user = { ...user, role: "officer" }
  }
  return user
})

export async function requireUser() {
  const user = await getMe()
  if (!user) throw new AppError("Please sign in.")
  return user
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser()
  if (!roles.includes(user.role)) throw new AppError("You don't have access to that.")
  return user
}

export async function requireVerifiedParticipant() {
  const user = await requireRole("participant")
  if (!user.verifiedAt) throw new AppError("Verify with the room code first.")
  return user
}

/** For pages: redirect instead of throwing. */
export async function pageUser(...roles: Role[]) {
  const user = await getMe()
  if (!user) redirect(isDemo() ? "/demo" : "/sign-in")
  if (roles.length && !roles.includes(user.role)) redirect("/")
  return user
}

export function homeFor(role: Role) {
  return { participant: "/dashboard", mentor: "/mentor", judge: "/judge", officer: "/admin" }[role]
}
