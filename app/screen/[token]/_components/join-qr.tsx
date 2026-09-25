"use client"

import QRCode from "qrcode"
import { useEffect, useState } from "react"

/** QR code for the join page, rendered in the browser so it reflects the real host. */
export function JoinQr({ className }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const url = `${window.location.origin}/join`
    QRCode.toDataURL(url, { margin: 1, width: 512, color: { dark: "#ffffff", light: "#00000000" } })
      .then(setSrc)
      .catch(() => setSrc(null))
  }, [])
  if (!src) return null
  // eslint-disable-next-line @next/next/no-img-element -- data URL generated client-side
  return <img src={src} alt="QR code to join" className={className} />
}
