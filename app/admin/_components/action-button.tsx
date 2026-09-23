"use client"

import { Button } from "@/components/ui/button"
import { useAction } from "@/components/use-action"
import type { ActionResult } from "@/lib/action"

/** A button that (optionally) confirms, then runs a server action via useAction. */
export function ActionButton<T>({
  action,
  confirm,
  success,
  children,
  variant = "outline",
  size = "sm",
  disabled,
}: {
  action: () => Promise<ActionResult<T>>
  confirm?: string
  success?: string
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  disabled?: boolean
}) {
  const { pending, exec } = useAction()
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return
        void exec(action, { success })
      }}
    >
      {children}
    </Button>
  )
}
