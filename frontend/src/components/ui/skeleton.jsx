import { cn } from "../../lib/utils";

const Skeleton = ({ className, ...props }) => (
  <div className={cn("animate-pulse-soft rounded-md bg-surface-tertiary", className)} {...props} />
);

const SkeletonCard = ({ className }) => (
  <div className={cn("rounded-xl border border-border-primary bg-surface p-6 space-y-4", className)}>
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 pb-3 border-b border-border-primary">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export { Skeleton, SkeletonCard, SkeletonTable };
