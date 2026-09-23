/**
 * Local stand-in for DynamoDB used in demo mode. Persists to .demo/db.json and evaluates the
 * subset of update/condition expressions this app uses, so the same safety rules apply locally.
 */
import fs from "node:fs"
import path from "node:path"

type Item = Record<string, unknown>
type Names = Record<string, string> | undefined
type Values = Record<string, unknown> | undefined

const FILE = process.env.DEMO_DB_FILE ?? path.join(process.cwd(), ".demo", "db.json")
const g = globalThis as unknown as { __demoDb?: Map<string, Item> }

function store(): Map<string, Item> {
  if (!g.__demoDb) {
    g.__demoDb = new Map()
    if (fs.existsSync(FILE)) {
      for (const it of JSON.parse(fs.readFileSync(FILE, "utf8")) as Item[]) g.__demoDb.set(k(it.PK, it.SK), it)
    }
  }
  return g.__demoDb
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify([...store().values()], null, 1))
}

export function resetStore() {
  g.__demoDb = new Map()
  save()
}

const k = (pk: unknown, sk: unknown) => `${pk}|${sk}`
const clone = <T>(v: T): T => (v === undefined ? v : structuredClone(v))

function fail(name: "ConditionalCheckFailedException" | "TransactionCanceledException") {
  const e = new Error(name)
  e.name = name
  return e
}

// ── Expression evaluation ────────────────────────────────────────────────

const resolve = (p: string, names: Names) => p.trim().split(".").map((s) => (s.startsWith("#") ? names![s] : s))

function getPath(item: Item | undefined, parts: string[]): unknown {
  let cur: unknown = item
  for (const p of parts) cur = cur && typeof cur === "object" ? (cur as Item)[p] : undefined
  return cur
}

function setPath(item: Item, parts: string[], value: unknown) {
  let cur = item
  for (const p of parts.slice(0, -1)) cur = (cur[p] ??= {}) as Item
  cur[parts.at(-1)!] = value
}

function removePath(item: Item, parts: string[]) {
  const parent = getPath(item, parts.slice(0, -1)) as Item | undefined
  if (parent) delete parent[parts.at(-1)!]
}

function operand(item: Item | undefined, token: string, names: Names, values: Values) {
  const t = token.trim()
  return t.startsWith(":") ? values![t] : getPath(item, resolve(t, names))
}

function atom(item: Item | undefined, a: string, names: Names, values: Values): boolean {
  const fn = a.match(/^(attribute_not_exists|attribute_exists)\((.+)\)$/)
  if (fn) {
    const v = fn[2].trim() === "PK" ? item : getPath(item, resolve(fn[2], names))
    return fn[1] === "attribute_exists" ? v !== undefined : v === undefined
  }
  const cmp = a.match(/^(.+?)\s*(<=|>=|<>|=|<|>)\s*(.+)$/)
  if (!cmp) throw new Error(`Unsupported condition: ${a}`)
  const l = operand(item, cmp[1], names, values) as number | string | undefined
  const r = operand(item, cmp[3], names, values) as number | string | undefined
  if (l === undefined || r === undefined) return cmp[2] === "<>"
  switch (cmp[2]) {
    case "=": return JSON.stringify(l) === JSON.stringify(r)
    case "<>": return JSON.stringify(l) !== JSON.stringify(r)
    case "<": return l < r
    case ">": return l > r
    case "<=": return l <= r
    default: return l >= r
  }
}

/** AND binds tighter than OR; no parentheses (none are used in this app). */
function check(item: Item | undefined, cond: string | undefined, names: Names, values: Values) {
  if (!cond) return true
  return cond.split(/\s+OR\s+/).some((clause) => clause.split(/\s+AND\s+/).every((a) => atom(item, a.trim(), names, values)))
}

function applyUpdate(item: Item, expr: string, names: Names, values: Values) {
  for (const [, kw, body] of expr.matchAll(/\b(SET|REMOVE)\b([\s\S]*?)(?=\bSET\b|\bREMOVE\b|$)/g)) {
    for (const part of body.split(",").map((s) => s.trim()).filter(Boolean)) {
      if (kw === "REMOVE") {
        removePath(item, resolve(part, names))
        continue
      }
      const [lhs, rhs] = part.split("=").map((s) => s.trim())
      const math = rhs.match(/^(.+?)\s*([+-])\s*(.+)$/)
      const value = math
        ? (Number(operand(item, math[1], names, values) ?? 0) + (math[2] === "-" ? -1 : 1) * Number(operand(item, math[3], names, values)))
        : operand(item, rhs, names, values)
      setPath(item, resolve(lhs, names), clone(value))
    }
  }
}

// ── Public API (mirrors lib/db.ts) ───────────────────────────────────────

export function memGet(pk: string, sk: string) {
  return clone(store().get(k(pk, sk)))
}

export function memPut(item: Item, condition?: string) {
  if (!check(store().get(k(item.PK, item.SK)), condition, undefined, undefined)) throw fail("ConditionalCheckFailedException")
  store().set(k(item.PK, item.SK), clone(item))
  save()
}

export function memUpdate(pk: string, sk: string, expr: string, condition: string | undefined, names: Names, values: Values) {
  const existing = store().get(k(pk, sk))
  if (!check(existing, condition, names, values)) throw fail("ConditionalCheckFailedException")
  const next = clone(existing) ?? { PK: pk, SK: sk }
  applyUpdate(next, expr, names, values)
  store().set(k(pk, sk), next)
  save()
  return clone(next)
}

export function memDelete(pk: string, sk: string) {
  store().delete(k(pk, sk))
  save()
}

export function memQuery(pk: string, prefix: string, newestFirst?: boolean, limit?: number) {
  const items = [...store().values()]
    .filter((it) => it.PK === pk && String(it.SK).startsWith(prefix))
    .sort((a, b) => String(a.SK).localeCompare(String(b.SK)))
  if (newestFirst) items.reverse()
  return clone(limit ? items.slice(0, limit) : items)
}

type TxItem = {
  Put?: { Item: Item; ConditionExpression?: string }
  Delete?: { Key: { PK: string; SK: string } }
  Update?: {
    Key: { PK: string; SK: string }
    UpdateExpression: string
    ConditionExpression?: string
    ExpressionAttributeNames?: Names
    ExpressionAttributeValues?: Values
  }
}

/** All-or-nothing: every condition is checked before anything is written. */
export function memTransact(items: TxItem[]) {
  for (const t of items) {
    const ok = t.Put
      ? check(store().get(k(t.Put.Item.PK, t.Put.Item.SK)), t.Put.ConditionExpression, undefined, undefined)
      : t.Update
        ? check(store().get(k(t.Update.Key.PK, t.Update.Key.SK)), t.Update.ConditionExpression, t.Update.ExpressionAttributeNames, t.Update.ExpressionAttributeValues)
        : true
    if (!ok) throw fail("TransactionCanceledException")
  }
  for (const t of items) {
    if (t.Put) store().set(k(t.Put.Item.PK, t.Put.Item.SK), clone(t.Put.Item))
    if (t.Delete) store().delete(k(t.Delete.Key.PK, t.Delete.Key.SK))
    if (t.Update) {
      const { Key, UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } = t.Update
      const next = clone(store().get(k(Key.PK, Key.SK))) ?? { ...Key }
      applyUpdate(next, UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues)
      store().set(k(Key.PK, Key.SK), next)
    }
  }
  save()
}

export const memSize = () => store().size
