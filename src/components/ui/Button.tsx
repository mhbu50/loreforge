import React from 'react';
import { cn } from '@/src/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[--bg] disabled:pointer-events-none disabled:opacity-40 select-none';

  const variants: Record<Variant, string> = {
    primary:   'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-sm',
    secondary: 'bg-[--bg-elev] text-[--fg] border border-[--border-strong] hover:bg-[--bg-sunken] active:scale-[0.98]',
    ghost:     'text-[--fg-muted] hover:text-[--fg] hover:bg-[--ink-a-06] active:bg-[--ink-a-08]',
    danger:    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
    outline:   'border border-violet-500 text-violet-400 hover:bg-violet-500/10 active:bg-violet-500/20',
  };

  const sizes: Record<Size, string> = {
    sm:   'text-xs px-3 py-1.5 h-7',
    md:   'text-sm px-4 py-2 h-9',
    lg:   'text-base px-6 py-2.5 h-11',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
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
