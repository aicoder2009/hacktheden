"use client"

import { useState } from "react"
import { createTeam, joinTeam, leaveTeam, removeMember } from "@/actions/team"
import { useAction } from "@/components/use-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { PublicTeam } from "@/lib/data"
import { MAX_TEAM_SIZE } from "@/lib/rules"

export function TeamPanel({
  meId,
  team,
  locked,
  prefillCode = "",
}: {
  meId: string
  team: PublicTeam | null
  locked: boolean
  /** From an invite link (/team?join=CODE) — lands the teammate straight on "Join" with the code filled in. */
  prefillCode?: string
}) {
  const { pending, exec } = useAction()
  const [name, setName] = useState("")
  const [code, setCode] = useState(prefillCode.toUpperCase())
  const [copied, setCopied] = useState<"code" | "link" | null>(null)

  async function copy(kind: "code" | "link") {
    if (!team) return
    const text = kind === "code" ? team.joinCode : `${window.location.origin}/team?join=${team.joinCode}`
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1500)
  }

  if (!team) {
    if (locked) return <p className="text-muted-foreground">Team changes are locked.</p>
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start a team</CardTitle>
            <CardDescription>You&apos;ll get a code to share with teammates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                exec(() => createTeam(name), { success: "Team created" })
              }}
            >
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" maxLength={40} required />
              <Button type="submit" disabled={pending}>Create</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Join a team</CardTitle>
            <CardDescription>
              {prefillCode ? "Your invite code is filled in — just hit Join." : "Ask your teammate for their code, or open the invite link they sent you."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                exec(() => joinTeam(code), { success: "You're in!" })
              }}
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC234"
                className="font-mono tracking-widest"
                maxLength={8}
                required
              />
              <Button type="submit" disabled={pending}>Join</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCaptain = team.captainId === meId
  const members = Object.entries(team.members).sort(([, a], [, b]) => a.joinedAt.localeCompare(b.joinedAt))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <CardDescription>
            {team.memberCount} of {MAX_TEAM_SIZE} members{locked && " · locked"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {team.memberCount < MAX_TEAM_SIZE && !locked && (
            <div className="flex flex-wrap items-center gap-3 border border-dashed p-4">
              <div>
                <div className="text-muted-foreground">Join code</div>
                <div className="font-mono text-3xl font-semibold tracking-[0.3em]">{team.joinCode}</div>
              </div>
              <div className="ml-auto flex flex-col gap-1.5 sm:flex-row">
                <Button variant="outline" size="sm" onClick={() => copy("code")}>
                  {copied === "code" ? "Copied" : "Copy code"}
                </Button>
                <Button size="sm" onClick={() => copy("link")}>
                  {copied === "link" ? "Link copied" : "Copy invite link"}
                </Button>
              </div>
            </div>
          )}

          <ul className="divide-y border-y">
            {members.map(([id, m]) => (
              <li key={id} className="flex items-center gap-2 py-2.5">
                <span className="text-sm">{m.name}</span>
                {id === team.captainId && <Badge variant="secondary">Captain</Badge>}
                {id === meId && <Badge variant="outline">You</Badge>}
                {isCaptain && id !== meId && !locked && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="ml-auto text-destructive"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Remove ${m.name} from the team?`)) exec(() => removeMember(id), { success: "Removed" })
                    }}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {!locked && (
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                const last = team.memberCount === 1
                const msg = last
                  ? "You're the last member — leaving deletes the team, its submission and its AI key. Continue?"
                  : "Leave this team?"
                if (confirm(msg)) exec(() => leaveTeam(), { success: "You left the team" })
              }}
            >
              Leave team
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
