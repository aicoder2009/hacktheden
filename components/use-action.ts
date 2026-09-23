"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import type { ActionResult } from "@/lib/action"

/**
 * Runs a server action, toasts errors (and optional success), then refreshes server data.
 * Returns the data on success, undefined on failure.
 */
export function useAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function exec<T>(fn: () => Promise<ActionResult<T>>, opts: { success?: string; refresh?: boolean } = {}) {
    return new Promise<T | undefined>((resolve) => {
      startTransition(async () => {
        const res = await fn()
        if (!res.ok) {
          setError(res.error)
          toast.error(res.error)
          resolve(undefined)
          return
        }
        setError(null)
        if (opts.success) toast.success(opts.success)
        if (opts.refresh !== false) router.refresh()
        resolve(res.data)
      })
    })
  }

  return { pending, error, exec }
}
