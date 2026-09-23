"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cancelTicket, openTicket } from "@/actions/tickets"
import { useAction } from "@/components/use-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fmtTime } from "@/lib/format"
import type { Ticket } from "@/lib/types"

const STATUS: Record<Ticket["status"], string> = {
  open: "Waiting for a mentor",
  claimed: "Mentor on the way",
  resolved: "Resolved",
  cancelled: "Cancelled",
}

export function HelpPanel({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter()
  const { pending, exec } = useAction()
  const active = tickets.find((t) => t.status === "open" || t.status === "claimed")
  const [form, setForm] = useState({ topic: "", description: "", location: tickets[0]?.location ?? "" })

  // Keep the status fresh while a request is active.
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [active, router])

  return (
    <div className="space-y-4">
      {active ? (
        <Card className="ring-primary/50">
          <CardHeader>
            <CardTitle>{STATUS[active.status]}</CardTitle>
            <CardDescription>
              {active.status === "claimed" ? `${active.mentorName} is coming to ${active.location}.` : `Requested at ${fmtTime(active.createdAt)}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="font-medium">{active.topic}</div>
              {active.description && <p className="whitespace-pre-wrap text-muted-foreground">{active.description}</p>}
            </div>
            {active.status === "open" && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => exec(() => cancelTicket(active.id), { success: "Request cancelled" })}
              >
                Cancel request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const ok = await exec(() => openTicket(form), { success: "A mentor has been notified" })
                if (ok !== undefined) setForm((f) => ({ ...f, topic: "", description: "" }))
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="topic">What do you need help with?</Label>
                <Input id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Deploying to Vercel" maxLength={80} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Details (optional)</Label>
                <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc">Where are you sitting?</Label>
                <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Table 4, by the window" maxLength={60} required />
              </div>
              <Button type="submit" disabled={pending}>Request a mentor</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tickets.filter((t) => t !== active).length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium text-muted-foreground">Earlier requests</h2>
          <ul className="divide-y border-y">
            {tickets
              .filter((t) => t !== active)
              .map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2 text-xs">
                  <span className="w-14 font-mono text-muted-foreground">{fmtTime(t.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate">{t.topic}</span>
                  <Badge variant="outline">{STATUS[t.status]}</Badge>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
