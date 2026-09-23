"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { verifyRoomCode } from "@/actions/me"
import { useAction } from "@/components/use-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VerifyForm({ defaultName }: { defaultName: string }) {
  const router = useRouter()
  const { pending, exec } = useAction()
  const [name, setName] = useState(defaultName)
  const [code, setCode] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await exec(() => verifyRoomCode({ name, code }), { success: "You're checked in!", refresh: false })
    if (ok !== undefined) router.push("/dashboard")
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="How teammates and judges see you" required />
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
        {pending ? "Checking…" : "Check in"}
      </Button>
    </form>
  )
}
