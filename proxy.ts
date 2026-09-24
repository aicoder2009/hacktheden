import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isDemo } from "@/lib/demo/mode"

// Only staff use Clerk; participants hold an account-less session cookie. So the proxy just makes
// Clerk's auth() available — every page, server action and route handler enforces access itself
// (pageUser / requireRole / requireVerifiedParticipant).
const clerk = clerkMiddleware()

// Local demo mode has its own user switcher; everywhere else Clerk is required.
export default isDemo() ? () => NextResponse.next() : clerk

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}
