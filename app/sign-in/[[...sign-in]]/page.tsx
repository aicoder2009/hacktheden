import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isDemo } from "@/lib/demo/mode"

export default function SignInPage() {
  if (isDemo()) redirect("/demo")
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <div className="space-y-4">
        <p className="text-center text-xs text-muted-foreground">
          Staff sign-in (officers, judges, mentors). Participants{" "}
          <Link href="/join" className="underline underline-offset-2">join with the room code</Link> instead.
        </p>
        <SignIn />
      </div>
    </main>
  )
}
