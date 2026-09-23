"use client"

import { setResultsReleased } from "@/actions/admin"
import { Switch } from "@/components/ui/switch"
import { useAction } from "@/components/use-action"

export function ReleaseToggle({ released, disabled }: { released: boolean; disabled: boolean }) {
  const { pending, exec } = useAction()
  return (
    <label className="flex items-center gap-3">
      <Switch
        checked={released}
        disabled={disabled || pending}
        onCheckedChange={(checked) => {
          const msg = checked
            ? "Release results now? Every participant will see the winners."
            : "Hide results from participants again?"
          if (!window.confirm(msg)) return
          void exec(() => setResultsReleased(checked), { success: checked ? "Results released" : "Results hidden" })
        }}
      />
      <span className="font-medium">{released ? "Results are visible to participants" : "Results are hidden"}</span>
      {disabled && <span className="text-muted-foreground">(lock results first)</span>}
    </label>
  )
}
