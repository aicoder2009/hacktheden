import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getMe, homeFor } from "@/lib/auth"
import { getEvent } from "@/lib/data"
import { JoinForm } from "./join-form"

export const metadata: Metadata = { title: "Join" }

export default async function JoinPage() {
  const [me, event] = await Promise.all([getMe(), getEvent()])
  if (me) redirect(homeFor(me.role))

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-sm font-semibold">
        <span className="grid size-6 place-items-center bg-primary text-[10px] font-bold text-primary-foreground">LP</span>
        {event.name}
      </Link>
      <p className="font-mono text-xs tracking-widest text-primary uppercase">Join</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">No account needed.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your name and the room code on the big screen. That&apos;s it — you&apos;re in, and you can form a team,
        submit and get your AI budget.
      </p>
      <JoinForm />
      <p className="mt-10 text-xs text-muted-foreground">
        Officer, judge or mentor?{" "}
        <Link href="/sign-in" className="underline underline-offset-2 hover:text-foreground">
          Staff sign in
        </Link>
      </p>
    </main>
  )
}
