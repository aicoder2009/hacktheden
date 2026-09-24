import { randomBytes, randomInt, timingSafeEqual } from "node:crypto"

// No look-alike characters (0/O, 1/I/L).
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function randomCode(length = 6) {
  let out = ""
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return out
}

export function normalizeCode(input: string) {
  return input.replace(/[\s-]/g, "").toUpperCase()
}

export function newScreenToken() {
  return randomBytes(24).toString("base64url")
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function newId() {
  return randomBytes(8).toString("hex")
}

/** Personal rejoin code for account-less participants, shown as XXXX-XXXX. */
export function newRejoinCode() {
  return randomCode(8)
}

export function formatRejoinCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
