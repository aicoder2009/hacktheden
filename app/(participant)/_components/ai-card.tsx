"use client"

import { useState } from "react"
import useSWR from "swr"
import { claimAiKey } from "@/actions/ai"
import { useAction } from "@/components/use-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RECOMMENDED_MODELS, setupSnippets } from "@/lib/constants"
import { fmtUsd } from "@/lib/format"
import type { TeamAI } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)))

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="xs"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  )
}

export function AiCard({ hasTeam }: { hasTeam: boolean }) {
  const { data, mutate } = useSWR<{ ai: TeamAI | null }>(hasTeam ? "/api/team/ai" : null, fetcher, {
    refreshInterval: 60_000,
  })
  const { pending, exec } = useAction()
  const [showKey, setShowKey] = useState(false)
  const [snippet, setSnippet] = useState(0)
  const ai = data?.ai

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI budget</CardTitle>
        <CardDescription>Your team&apos;s OpenRouter key with a hard spending cap.</CardDescription>
        {ai?.status === "active" && (
          <CardAction>
            {ai.disabled ? <Badge variant="destructive">Disabled</Badge> : <Badge variant="secondary">Active</Badge>}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTeam ? (
          <p className="text-muted-foreground">Join or create a team to get your AI key.</p>
        ) : !data ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : ai?.status !== "active" ? (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              One key per team — anyone on the team can create it and everyone can use it.
            </p>
            <Button
              disabled={pending || ai?.status === "pending"}
              onClick={async () => {
                await exec(() => claimAiKey(), { success: "Your AI key is ready" })
                mutate()
              }}
            >
              {pending || ai?.status === "pending" ? "Creating key…" : "Get our AI key"}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-lg font-semibold">{fmtUsd(ai.usageUsd)}</span>
                <span className="text-muted-foreground">of {fmtUsd(ai.limitUsd)} used</span>
              </div>
              <Progress value={Math.min(100, (ai.usageUsd / ai.limitUsd) * 100)} />
              {ai.usageUsd >= ai.limitUsd && (
                <p className="text-destructive">Budget used up — the key has stopped working.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-muted-foreground">API key</div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate bg-muted px-2 py-1.5 font-mono">
                  {showKey ? ai.key : `${ai.key.slice(0, 12)}${"•".repeat(20)}`}
                </code>
                <Button size="xs" variant="ghost" onClick={() => setShowKey((s) => !s)}>
                  {showKey ? "Hide" : "Show"}
                </Button>
                <CopyButton text={ai.key} />
              </div>
              <p className="text-muted-foreground">Don&apos;t commit it to GitHub — your repo is public.</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-muted-foreground">Recommended models</div>
              <ul className="space-y-1">
                {RECOMMENDED_MODELS.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <code className="font-mono">{m.id}</code>
                      <span className="block text-muted-foreground">{m.note}</span>
                    </span>
                    <CopyButton text={m.id} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="text-muted-foreground">Set up your tool</div>
              <div className="flex flex-wrap gap-1">
                {setupSnippets(ai.key).map((s, i) => (
                  <Button key={s.tool} size="xs" variant={i === snippet ? "secondary" : "ghost"} onClick={() => setSnippet(i)}>
                    {s.tool}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <pre className="overflow-x-auto bg-muted p-3 font-mono text-[11px] leading-relaxed">
                  {setupSnippets(showKey ? ai.key : "<your key>")[snippet].code}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={setupSnippets(ai.key)[snippet].code} />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
