import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <p className="font-mono text-xs tracking-widest text-primary uppercase">404</p>
      <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Nothing here.</h1>
      <p className="mt-2 text-sm text-muted-foreground">That link doesn&apos;t go anywhere. Head back to the start.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className={buttonVariants()}>
          Home
        </Link>
        <Link href="/join" className={buttonVariants({ variant: "outline" })}>
          Join the hackathon
        </Link>
      </div>
    </main>
  )
}
