import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ hover, glass, padding = 'md', className, children, ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-8' };
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-bg-secondary shadow-card',
        hover && 'transition-all duration-200 hover:border-hover hover:shadow-elevated cursor-pointer',
        glass && 'backdrop-blur-md bg-white/5 border-white/10',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between mb-4', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-text-primary', className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-text-muted', className)} {...props}>{children}</p>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-border', className)} {...props}>{children}</div>;
}
