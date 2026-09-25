import { isLocalData } from "./demo/mode"
import { env } from "./env"

const BASE = "https://openrouter.ai/api/v1/keys"

/** AI keys are offered only once a provisioning key exists (local/demo mode fakes one). */
export const aiEnabled = () => isLocalData() || !!env().OPENROUTER_PROVISIONING_KEY

export type KeyInfo = {
  hash: string
  name: string
  disabled: boolean
  limit: number | null
  limit_remaining: number | null
  usage: number
}

// Demo mode: fake keys whose usage creeps up ~3¢ a minute so the budget bar moves.
const demoKeys = ((globalThis as { __demoKeys?: Map<string, { disabled: boolean }> }).__demoKeys ??= new Map())
function demoInfo(hash: string): KeyInfo {
  const created = Number(hash.split("-")[1]) || Date.now()
  const usage = Math.min(5, Math.round(((Date.now() - created) / 60_000) * 3) / 100)
  return { hash, name: hash, disabled: demoKeys.get(hash)?.disabled ?? false, limit: 5, limit_remaining: 5 - usage, usage }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isLocalData()) {
    if (init.method === "POST") {
      const hash = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return { key: `sk-or-v1-demo-${hash.slice(-6)}9c2e1b4d7f3a`, data: demoInfo(hash) } as T
    }
    const hash = path.slice(1)
    if (init.method === "PATCH") demoKeys.set(hash, { disabled: JSON.parse(String(init.body)).disabled })
    return { data: demoInfo(hash) } as T
  }
  const key = env().OPENROUTER_PROVISIONING_KEY
  if (!key) throw new Error("OPENROUTER_PROVISIONING_KEY is not set")
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`OpenRouter ${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

/** Creates a key with a hard USD spending limit. The raw key is only returned here, once. */
export async function createKey(name: string, limitUsd: number) {
  const res = await call<{ key: string; data: KeyInfo }>("", {
    method: "POST",
    body: JSON.stringify({ name, limit: limitUsd }),
  })
  if (!res.key || !res.data?.hash) throw new Error("Unexpected OpenRouter create-key response")
  return { key: res.key, info: res.data }
}

export async function getKey(hash: string) {
  return (await call<{ data: KeyInfo }>(`/${hash}`)).data
}

export async function setKeyDisabled(hash: string, disabled: boolean) {
  return (await call<{ data: KeyInfo }>(`/${hash}`, { method: "PATCH", body: JSON.stringify({ disabled }) })).data
}

export async function deleteKey(hash: string) {
  await call(`/${hash}`, { method: "DELETE" })
}
