import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { homeFor, pageUser } from "@/lib/auth"
import { MAX_VERIFY_FAILS } from "@/lib/rules"
import { VerifyForm } from "./verify-form"

export const metadata: Metadata = { title: "Check in" }

export default async function VerifyPage() {
  const user = await pageUser()
  if (user.role !== "participant") redirect(homeFor(user.role))
  if (user.verifiedAt) redirect("/dashboard")
  const locked = user.verifyFails >= MAX_VERIFY_FAILS

  return (
    <AppShell>
      <div className="mx-auto max-w-md py-10">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">Check in</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">You made it. Prove it.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the room code shown on the big screen at the venue. This checks you in and unlocks teams, submissions
          and your AI budget.
        </p>
        {locked ? (
          <p className="mt-8 border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Too many wrong codes. Find an officer and they&apos;ll check you in.
          </p>
        ) : (
          <VerifyForm defaultName={user.name} />
        )}
      </div>
    </AppShell>
  )
}
