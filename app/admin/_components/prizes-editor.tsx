"use client"

import { useState } from "react"
import { updatePrizes } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/components/use-action"
import type { Prize } from "@/lib/types"
import { slugId } from "./slug-id"

type Row = { key: string; id: string | null; name: string; description: string }

const toRows = (prizes: Prize[]): Row[] => prizes.map((p) => ({ key: p.id, id: p.id, name: p.name, description: p.description }))

export function PrizesEditor({ prizes, resultsLocked }: { prizes: Prize[]; resultsLocked: boolean }) {
  const { pending, exec } = useAction()
  const [rows, setRows] = useState(() => toRows(prizes))
  const update = (key: string, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  function save() {
    const next: Prize[] = rows.map((r) => ({ id: r.id ?? slugId(r.name), name: r.name.trim(), description: r.description.trim() }))
    void exec(() => updatePrizes(next), { success: "Prizes saved" }).then((ok) => {
      if (ok !== undefined) setRows(toRows(next)) // keep generated ids so a re-save doesn't mint new ones
    })
  }

  return (
    <div className="grid gap-3">
      {resultsLocked && (
        <p className="border border-dashed px-2.5 py-2 text-muted-foreground">
          Results are locked. Renaming is fine, but removing a prize that already has a winner will hide it from the reveal.
        </p>
      )}
      <fieldset disabled={pending} className="grid gap-3">
        {rows.length === 0 && <p className="text-muted-foreground">No prize categories — only 1st, 2nd and 3rd will be awarded.</p>}
        {rows.map((r) => (
          <div key={r.key} className="grid gap-2 border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={r.name}
                onChange={(e) => update(r.key, { name: e.target.value })}
                placeholder="e.g. Best use of AI"
                maxLength={60}
                aria-label="Prize name"
              />
              <Button variant="ghost" size="xs" onClick={() => setRows(rows.filter((x) => x.key !== r.key))}>
                Remove
              </Button>
            </div>
            <Textarea
              value={r.description}
              onChange={(e) => update(r.key, { description: e.target.value })}
              placeholder="Optional description"
              maxLength={300}
              className="min-h-10"
              aria-label="Prize description"
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={rows.length >= 10}
            onClick={() => setRows([...rows, { key: crypto.randomUUID(), id: null, name: "", description: "" }])}
          >
            Add prize
          </Button>
          <Button size="sm" onClick={save}>
            {pending ? "Saving…" : "Save prizes"}
          </Button>
        </div>
      </fieldset>
    </div>
  )
}
