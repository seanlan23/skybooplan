import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface RouteStayCardSkeletonProps {
  className?: string
}

export function RouteStayCardSkeleton({ className }: RouteStayCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col shrink-0 w-[min(100%,260px)] sm:w-[260px]',
        'bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden',
        className
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none shrink-0" />
      <div className="flex flex-col flex-1 p-3 gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
