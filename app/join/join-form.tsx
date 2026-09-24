"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { joinWithRoomCode, rejoinWithCode } from "@/actions/join"
import { useAction } from "@/components/use-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function JoinForm() {
  const router = useRouter()
  const { pending, exec } = useAction()
  const [mode, setMode] = useState<"join" | "rejoin">("join")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [rejoin, setRejoin] = useState("")

  async function onJoin(e: React.FormEvent) {
    e.preventDefault()
    const ok = await exec(() => joinWithRoomCode({ name, code }), { success: "You're in!", refresh: false })
    if (ok !== undefined) router.push("/dashboard")
  }

  async function onRejoin(e: React.FormEvent) {
    e.preventDefault()
    const ok = await exec(() => rejoinWithCode(rejoin), { success: "Welcome back!", refresh: false })
    if (ok !== undefined) router.push("/dashboard")
  }

  if (mode === "rejoin") {
    return (
      <form onSubmit={onRejoin} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="rejoin">Your rejoin code</Label>
          <Input
            id="rejoin"
            value={rejoin}
            onChange={(e) => setRejoin(e.target.value.toUpperCase())}
            placeholder="ABCD-2345"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={9}
            className="h-14 text-center font-mono text-2xl tracking-[0.3em]"
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">It&apos;s on your dashboard on the device you joined from.</p>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending || rejoin.length < 8}>
          {pending ? "Checking…" : "Get back in"}
        </Button>
        <button type="button" onClick={() => setMode("join")} className="text-xs text-muted-foreground underline underline-offset-2">
          ← Joining for the first time
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={onJoin} className="mt-8 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="How teammates and judges see you" required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="code">Room code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC234"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={8}
          className="h-14 text-center font-mono text-3xl tracking-[0.4em]"
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending || code.length < 4}>
        {pending ? "Joining…" : "Join the hackathon"}
      </Button>
      <button type="button" onClick={() => setMode("rejoin")} className="text-xs text-muted-foreground underline underline-offset-2">
        Already joined on another device? Use your rejoin code
      </button>
    </form>
  )
}
