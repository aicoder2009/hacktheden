import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isDemo } from "@/lib/demo/mode"

// Signed-in check only. Roles live in DynamoDB and are enforced in layouts, actions and route handlers.
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/screen/(.*)", "/api/screen/(.*)", "/demo(.*)", "/api/demo/(.*)"])

const clerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect()
})

// Local demo mode has its own user switcher; everywhere else Clerk is required.
export default isDemo() ? () => NextResponse.next() : clerk

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
