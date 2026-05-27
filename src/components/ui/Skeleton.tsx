import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton-pulse bg-slate-100 rounded-xl', className)} />
  )
}

export function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden',
        wide ? 'min-h-[420px]' : 'min-h-[400px]'
      )}
    >
      <Skeleton
        className={cn(
          'w-full shrink-0 rounded-none',
          wide ? 'aspect-[16/10] min-h-[200px]' : 'h-48'
        )}
      />
      <div className="flex flex-col flex-1 p-4 space-y-3 justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex justify-between items-end">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonDayCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}
