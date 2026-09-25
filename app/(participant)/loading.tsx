import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2 border-b pb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-64 max-w-full" />
      </div>
      <Skeleton className="h-14" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-32 sm:col-span-2" />
        </div>
        <Skeleton className="h-56" />
      </div>
    </div>
  )
}
