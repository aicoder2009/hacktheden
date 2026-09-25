"use client"

import { useActionState, useState } from "react"
import { joinFormAction, rejoinFormAction } from "@/actions/join"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Uncontrolled inputs + form actions: typing and submitting work even before JavaScript loads.
export function JoinForm() {
  const [mode, setMode] = useState<"join" | "rejoin">("join")
  const [joined, join, joining] = useActionState(joinFormAction, null)
  const [rejoined, rejoin, rejoining] = useActionState(rejoinFormAction, null)

  if (mode === "rejoin") {
    return (
      <form action={rejoin} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="rejoin">Your rejoin code</Label>
          <Input
            id="rejoin"
            name="rejoin"
            defaultValue={rejoined?.values.rejoin}
            placeholder="ABCD-2345"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={9}
            className="h-14 text-center font-mono text-2xl tracking-[0.3em] uppercase"
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">It&apos;s on your dashboard on the device you joined from.</p>
        </div>
        {rejoined && <p role="alert" className="text-sm text-destructive">{rejoined.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={rejoining}>
          {rejoining ? "Checking…" : "Get back in"}
        </Button>
        <button type="button" onClick={() => setMode("join")} className="text-xs text-muted-foreground underline underline-offset-2">
          ← Joining for the first time
        </button>
      </form>
    )
  }

  return (
    <form action={join} className="mt-8 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" defaultValue={joined?.values.name} placeholder="How teammates and judges see you" autoComplete="name" required minLength={2} maxLength={60} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="code">Room code</Label>
        <Input
          id="code"
          name="code"
          defaultValue={joined?.values.code}
          placeholder="ABC234"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={8}
          className="h-14 text-center font-mono text-3xl tracking-[0.4em] uppercase"
          required
        />
      </div>
      {joined && <p role="alert" className="text-sm text-destructive">{joined.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={joining}>
        {joining ? "Joining…" : "Join the hackathon"}
      </Button>
      <button type="button" onClick={() => setMode("rejoin")} className="text-xs text-muted-foreground underline underline-offset-2">
        Already joined on another device? Use your rejoin code
      </button>
    </form>
  )
}
