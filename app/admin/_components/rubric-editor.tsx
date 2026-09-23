"use client"

import { useState } from "react"
import { updateRubric } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/components/use-action"
import type { Criterion } from "@/lib/types"
import { slugId } from "./slug-id"

type Row = { key: string; id: string | null; name: string; description: string; weight: string }

const toRows = (criteria: Criterion[]): Row[] =>
  criteria.map((c) => ({ key: c.id, id: c.id, name: c.name, description: c.description, weight: String(c.weight) }))

export function RubricEditor({ criteria, locked }: { criteria: Criterion[]; locked: boolean }) {
  const { pending, exec } = useAction()
  const [rows, setRows] = useState(() => toRows(criteria))
  const update = (key: string, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const totalWeight = rows.reduce((a, r) => a + (Number(r.weight) || 0), 0)

  function save() {
    const next: Criterion[] = rows.map((r) => ({
      id: r.id ?? slugId(r.name),
      name: r.name.trim(),
      description: r.description.trim(),
      weight: Number(r.weight),
    }))
    void exec(() => updateRubric(next), { success: "Rubric saved" }).then((ok) => {
      if (ok !== undefined) setRows(toRows(next)) // keep generated ids so a re-save doesn't mint new ones
    })
  }

  return (
    <div className="grid gap-3">
      {locked && (
        <p className="border border-dashed px-2.5 py-2 text-muted-foreground">
          Judges have started scoring, so the rubric can no longer change.
        </p>
      )}
      <fieldset disabled={locked || pending} className="grid gap-3">
        {rows.map((r, i) => (
          <div key={r.key} className="grid gap-2 border p-3">
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 font-mono text-muted-foreground">{i + 1}</span>
              <Input
                value={r.name}
                onChange={(e) => update(r.key, { name: e.target.value })}
                placeholder="Criterion name"
                maxLength={60}
                aria-label="Criterion name"
              />
              <label className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                ×
                <Input
                  type="number"
                  min={0.1}
                  max={10}
                  step="0.5"
                  value={r.weight}
                  onChange={(e) => update(r.key, { weight: e.target.value })}
                  className="w-16"
                  aria-label="Weight"
                />
              </label>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                aria-label={`Remove ${r.name || "criterion"}`}
              >
                Remove
              </Button>
            </div>
            <Textarea
              value={r.description}
              onChange={(e) => update(r.key, { description: e.target.value })}
              placeholder="What should judges look for?"
              maxLength={300}
              className="min-h-10"
              aria-label="Description"
            />
            {totalWeight > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {Math.round(((Number(r.weight) || 0) / totalWeight) * 100)}% of the total score
              </span>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={rows.length >= 10}
            onClick={() =>
              setRows([...rows, { key: crypto.randomUUID(), id: null, name: "", description: "", weight: "1" }])
            }
          >
            Add criterion
          </Button>
          <Button size="sm" onClick={save}>
            {pending ? "Saving…" : "Save rubric"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRows(toRows(criteria))}>
            Reset
          </Button>
        </div>
      </fieldset>
    </div>
  )
}
