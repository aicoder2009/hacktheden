import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { keys } from "./data"
import { deleteItem, getItem, putItem } from "./db"
import type { User } from "./types"

/**
 * Account-less participant sessions. The browser holds a random token in an httpOnly cookie;
 * only its hash is stored (SESSION#<hash> → userId), so a leaked database never yields a usable cookie.
 */
export const SESSION_COOKIE = "lp_session"
const MAX_AGE_S = 60 * 60 * 24 * 60 // 60 days — long enough for the whole event and follow-up

const hash = (token: string) => createHash("sha256").update(token).digest("base64url")

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  await putItem(keys.session(hash(token)), { userId, createdAt: new Date().toISOString() })
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  })
}

/** The participant behind the session cookie, if any. */
export async function sessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await getItem<{ userId: string }>(keys.session(hash(token)))
  return session ? ((await getItem<User>(keys.user(session.userId))) ?? null) : null
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await deleteItem(keys.session(hash(token)))
  jar.delete(SESSION_COOKIE)
}
