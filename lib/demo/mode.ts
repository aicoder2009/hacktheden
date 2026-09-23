/**
 * Demo mode: a fully local, clickable app with no AWS/Clerk/OpenRouter, where anyone can pick
 * who they are. Opt-in only (`npm run demo` sets DEMO_MODE=1) and never enabled in production.
 */
export function isDemo() {
  return process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "1"
}
