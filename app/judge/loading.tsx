import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="mb-6 h-16" />
      <div className="grid gap-px border bg-border">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 bg-background p-4">
            <Skeleton className="h-3 w-6" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
