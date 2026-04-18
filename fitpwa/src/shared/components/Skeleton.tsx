import { cn } from '../utils/cn'

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton block — animates a pulse between surface shades.
 * Usage: <Skeleton className="h-10 w-full rounded-xl" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-xl bg-surface-100',
        className
      )}
    />
  )
}

/** A stacked set of text-line skeletons */
Skeleton.Lines = function SkeletonLines({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

/** A card skeleton with a header row and body lines */
Skeleton.Card = function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl bg-surface-200 border border-surface-100 flex flex-col gap-4',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <Skeleton.Lines lines={2} />
    </div>
  )
}

/** A list of N card skeletons */
Skeleton.List = function SkeletonList({
  count = 3,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="A carregar…">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton.Card key={i} />
      ))}
    </div>
  )
}
