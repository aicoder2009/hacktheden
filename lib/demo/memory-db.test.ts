import os from "node:os"
import path from "node:path"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

process.env.DEMO_DB_FILE = path.join(os.tmpdir(), `hacktheden-demo-test-${process.pid}.json`)
let db: typeof import("./memory-db")
beforeAll(async () => {
  db = await import("./memory-db")
})
beforeEach(() => db.resetStore())

const PK = "EVENT#t"

describe("memory db", () => {
  it("enforces attribute_not_exists(PK) on put", () => {
    db.memPut({ PK, SK: "A", v: 1 }, "attribute_not_exists(PK)")
    expect(() => db.memPut({ PK, SK: "A", v: 2 }, "attribute_not_exists(PK)")).toThrow("ConditionalCheckFailed")
    expect(db.memGet(PK, "A")?.v).toBe(1)
  })

  it("applies SET with nested paths and arithmetic under a version condition", () => {
    db.memPut({ PK, SK: "T", members: { a: 1 }, memberCount: 1, version: 1 })
    const expr = "SET #m.#u = :m, #c = #c + :one, #v = #v + :one"
    const names = { "#m": "members", "#u": "b", "#c": "memberCount", "#v": "version" }
    db.memUpdate(PK, "T", expr, "#v = :v AND #c < :max", names, { ":m": 2, ":one": 1, ":v": 1, ":max": 4 })
    expect(db.memGet(PK, "T")).toMatchObject({ members: { a: 1, b: 2 }, memberCount: 2, version: 2 })
    // Stale version fails
    expect(() =>
      db.memUpdate(PK, "T", expr, "#v = :v AND #c < :max", names, { ":m": 3, ":one": 1, ":v": 1, ":max": 4 })
    ).toThrow()
  })

  it("supports OR conditions and REMOVE", () => {
    db.memPut({ PK, SK: "T", ai: { at: "2026-01-01T00:00:00Z" } })
    const names = { "#ai": "ai", "#at": "at" }
    const cond = "attribute_not_exists(#ai) OR #ai.#at < :stale"
    expect(() => db.memUpdate(PK, "T", "SET #ai = :p", cond, names, { ":p": {}, ":stale": "2025-01-01" })).toThrow()
    db.memUpdate(PK, "T", "SET #ai = :p", cond, names, { ":p": { x: 1 }, ":stale": "2027-01-01" })
    db.memUpdate(PK, "T", "REMOVE #ai", undefined, names, undefined)
    expect(db.memGet(PK, "T")?.ai).toBeUndefined()
  })

  it("rolls back a transaction when any condition fails", () => {
    db.memPut({ PK, SK: "U", teamId: "x" })
    expect(() =>
      db.memTransact([
        { Put: { Item: { PK, SK: "NEW" } } },
        { Update: { Key: { PK, SK: "U" }, UpdateExpression: "SET teamId = :t", ConditionExpression: "attribute_not_exists(teamId)", ExpressionAttributeValues: { ":t": "y" } } },
      ])
    ).toThrow("TransactionCanceled")
    expect(db.memGet(PK, "NEW")).toBeUndefined()
    expect(db.memGet(PK, "U")?.teamId).toBe("x")
  })

  it("queries by prefix, newest first, with limit", () => {
    for (const sk of ["ANN#1", "ANN#2", "ANN#3", "SCHED#1"]) db.memPut({ PK, SK: sk })
    expect(db.memQuery(PK, "ANN#", true, 2).map((i) => i.SK)).toEqual(["ANN#3", "ANN#2"])
  })
})
