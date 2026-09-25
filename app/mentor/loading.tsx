import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, col) => (
          <div key={col} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
