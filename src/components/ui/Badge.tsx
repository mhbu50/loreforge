import React from 'react';
import { cn } from '@/src/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default:  'bg-[--bg-sunken] text-[--fg-muted] border border-[--border]',
    primary:  'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    success:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    warning:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    danger:   'bg-red-500/20 text-red-300 border border-red-500/30',
    info:     'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    outline:  'bg-transparent text-[--fg-muted] border border-[--border-strong]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
