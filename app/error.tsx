"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Button, buttonVariants } from "@/components/ui/button"

/** Route-level error boundary: keeps the header/theme and offers a retry instead of a bare 500. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <p className="font-mono text-xs tracking-widest text-destructive uppercase">Something went wrong</p>
      <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">That didn&apos;t load.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Usually a blip on the venue Wi-Fi. Try again — if it keeps happening, grab an officer.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-muted-foreground">ref {error.digest}</p>}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </main>
  )
}
