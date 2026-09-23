"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { splitDuration } from "@/lib/format"

/**
 * Ticks every second toward `target`. `serverNow` corrects for a skewed client clock
 * (the projector laptop's clock may be off).
 */
export function Countdown({
  target,
  serverNow,
  className,
  doneLabel = "Time's up",
}: {
  target: string | null
  serverNow?: string
  className?: string
  doneLabel?: string
}) {
  const skew = useRef(0)
  // Server-corrected current time.
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (serverNow) skew.current = new Date(serverNow).getTime() - Date.now()
  }, [serverNow])

  useEffect(() => {
    const tick = () => setNow(Date.now() + skew.current)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!target) return <span className={className}>--:--:--</span>
  if (now === null) return <span className={cn("tabular-nums", className)}>&nbsp;</span>
  const left = new Date(target).getTime() - now
  if (left <= 0) return <span className={className}>{doneLabel}</span>
  const { h, m, s } = splitDuration(left)
  const pad = (n: number) => String(n).padStart(2, "0")
  return <span className={cn("tabular-nums", className)}>{`${pad(h)}:${pad(m)}:${pad(s)}`}</span>
}
