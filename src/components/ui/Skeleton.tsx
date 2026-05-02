import React from 'react';
import { cn } from '@/src/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
  lines?: number;
}

export function Skeleton({ variant = 'rect', lines = 1, className, ...props }: SkeletonProps) {
  const base = 'animate-pulse bg-[--bg-sunken] rounded';

  if (variant === 'circle') {
    return <div className={cn(base, 'rounded-full', className)} {...props} />;
  }

  if (variant === 'text') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, 'h-3 rounded-full', i === lines - 1 && lines > 1 && 'w-3/4', className)}
          />
        ))}
      </div>
    );
  }

  return <div className={cn(base, className)} {...props} />;
}
