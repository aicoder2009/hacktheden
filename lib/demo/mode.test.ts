import { afterEach, describe, expect, it, vi } from "vitest"
import { isDemo } from "./mode"

afterEach(() => vi.unstubAllEnvs())

describe("isDemo", () => {
  it("is off by default, even without AWS keys", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DEMO_MODE", "")
    vi.stubEnv("APP_AWS_ACCESS_KEY_ID", "")
    expect(isDemo()).toBe(false)
  })
  it("turns on only when explicitly requested in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DEMO_MODE", "1")
    expect(isDemo()).toBe(true)
  })
  it("can never turn on in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("DEMO_MODE", "1")
    expect(isDemo()).toBe(false)
  })
})
