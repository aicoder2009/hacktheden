import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function enabled(vars: Record<string, string>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v)
  const { aiEnabled } = await import("./openrouter")
  return aiEnabled()
}

describe("aiEnabled", () => {
  const prod = {
    NODE_ENV: "production",
    DEMO_MODE: "",
    EVENT_ID: "e",
    APP_AWS_REGION: "us-east-1",
    APP_AWS_ACCESS_KEY_ID: "AKIA_TEST",
    APP_AWS_SECRET_ACCESS_KEY: "s",
    DYNAMODB_TABLE: "t",
    S3_BUCKET: "b",
  }
  it("is off in production until a provisioning key exists", async () => {
    expect(await enabled({ ...prod, OPENROUTER_PROVISIONING_KEY: "" })).toBe(
      false
    )
    expect(
      await enabled({ ...prod, OPENROUTER_PROVISIONING_KEY: "sk-or-v1-prov" })
    ).toBe(true)
  })
  it("is always on with local data (fake keys)", async () => {
    expect(
      await enabled({
        NODE_ENV: "development",
        DEMO_MODE: "",
        APP_AWS_ACCESS_KEY_ID: "",
        OPENROUTER_PROVISIONING_KEY: "",
      })
    ).toBe(true)
  })
})
