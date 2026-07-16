import React from 'react';

interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

export default function Skeleton({ className = '', circle = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
    />
  );
}

// Complex Skeleton Templates
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 mb-4 border-b pb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-6 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`r-${rowIndex}`} className="flex gap-4 mb-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`c-${rowIndex}-${colIndex}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-xl bg-white/50 dark:bg-gray-900/50 flex flex-col gap-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
