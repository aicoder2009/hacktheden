/**
 * Demo mode: a fully local, clickable app with no AWS/Clerk/OpenRouter.
 * On automatically in development when no AWS keys are configured. Never in production.
 */
export function isDemo() {
  return process.env.NODE_ENV !== "production" && !process.env.APP_AWS_ACCESS_KEY_ID
}
