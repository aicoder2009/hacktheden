import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Loading…</span>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-40" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Skeleton className="aspect-video" />
            <Skeleton className="aspect-video" />
            <Skeleton className="aspect-video" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
