import React from 'react';
import { cn } from '@/src/lib/utils';

type Variant = 'ghost' | 'solid' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  label: string;
}

export function IconButton({ variant = 'ghost', size = 'md', label, className, children, ...props }: IconButtonProps) {
  const variants: Record<Variant, string> = {
    ghost:   'text-[--fg-subtle] hover:text-[--fg] hover:bg-[--bg-sunken]',
    solid:   'bg-violet-600 text-white hover:bg-violet-500',
    outline: 'border border-[--border-strong] text-[--fg-muted] hover:border-[--border] hover:text-[--fg]',
  };

  const sizes: Record<Size, string> = {
    sm: 'h-7 w-7 text-sm',
    md: 'h-9 w-9 text-base',
    lg: 'h-11 w-11 text-lg',
  };

  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
