/**
 * Demo mode: a fully local, clickable app with no AWS/Clerk/OpenRouter, where anyone can pick
 * who they are. Opt-in only (`npm run demo` sets DEMO_MODE=1) and never enabled in production.
 */
export function isDemo() {
  return process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "1"
}

/**
 * Local data: store data in .demo/ with fake S3/OpenRouter instead of AWS. Used by demo mode and by
 * `npm run dev` before AWS is configured (sign-in is still real Clerk then). Never in production —
 * there, missing AWS keys fail loudly.
 */
export function isLocalData() {
  return process.env.NODE_ENV !== "production" && (isDemo() || !process.env.APP_AWS_ACCESS_KEY_ID)
}
