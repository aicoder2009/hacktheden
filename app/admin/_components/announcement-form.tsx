"use client"

import { useState } from "react"
import { postAnnouncement } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/components/use-action"

export function AnnouncementForm() {
  const { pending, exec } = useAction()
  const [body, setBody] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await exec(() => postAnnouncement({ body }), { success: "Announcement posted" })
    if (ok !== undefined) setBody("")
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Pizza is here! Grab a slice by the stage."
        maxLength={500}
        required
        className="min-h-24"
        aria-label="Announcement"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground tabular-nums">{body.length}/500</span>
        <Button type="submit" disabled={pending || !body.trim()}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  )
}
