import React from 'react';
import { cn } from '@/src/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'magic';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  glow?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

  const variants: Record<Variant, string> = {
    primary:   'bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-[0.98]',
    secondary: 'bg-bg-tertiary text-text-primary border border-border hover:border-hover hover:bg-bg-hover active:scale-[0.98]',
    ghost:     'text-text-muted hover:text-text-primary hover:bg-bg-hover active:bg-bg-tertiary',
    danger:    'bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98]',
    outline:   'border border-[var(--color-primary)] text-primary hover:bg-[var(--color-primary)]/10 active:bg-[var(--color-primary)]/20',
    magic:     'bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:opacity-90 active:scale-[0.98] shadow-glow-sm',
  };

  const sizes: Record<Size, string> = {
    sm:   'text-xs px-3 py-1.5 h-7',
    md:   'text-sm px-4 py-2 h-9',
    lg:   'text-base px-6 py-2.5 h-11',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], glow && 'shadow-glow', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
