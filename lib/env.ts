import { z } from "zod"
import { isDemo, isLocalData } from "./demo/mode"

const schema = z.object({
  EVENT_ID: z.string().min(1),
  SUPER_ADMIN_EMAILS: z.string().default(""),
  APP_AWS_REGION: z.string().min(1),
  APP_AWS_ACCESS_KEY_ID: z.string().min(1),
  APP_AWS_SECRET_ACCESS_KEY: z.string().min(1),
  DYNAMODB_TABLE: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  OPENROUTER_PROVISIONING_KEY: z.string().default(""),
})

let cached: z.infer<typeof schema> | undefined

// Parsed lazily so builds don't need runtime secrets.
export function env() {
  cached ??= schema.parse(
    isLocalData()
      ? {
          EVENT_ID: isDemo() ? "demo" : "basha-2026-11",
          SUPER_ADMIN_EMAILS: "karthickarun2009@gmail.com",
          APP_AWS_REGION: "local",
          APP_AWS_ACCESS_KEY_ID: "demo",
          APP_AWS_SECRET_ACCESS_KEY: "demo",
          DYNAMODB_TABLE: "demo",
          S3_BUCKET: "demo",
          ...process.env,
        }
      : process.env
  )
  return cached
}

export function superAdminEmails() {
  return env()
    .SUPER_ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function awsConfig() {
  const e = env()
  return {
    region: e.APP_AWS_REGION,
    credentials: { accessKeyId: e.APP_AWS_ACCESS_KEY_ID, secretAccessKey: e.APP_AWS_SECRET_ACCESS_KEY },
  }
}
