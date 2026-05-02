import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-nebula">{label}</label>
        )}
        <div className="relative flex items-center">
          {leftIcon && <span className="absolute left-3.5 text-nebula pointer-events-none">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-3 bg-void/80 border border-white/[0.08] rounded-xl text-starlight placeholder:text-nebula/60',
              'focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-all duration-200 backdrop-blur-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-magenta/60 focus:border-magenta focus:ring-magenta/10',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="absolute right-3.5 text-nebula pointer-events-none">{rightIcon}</span>}
        </div>
        {error && <p className="text-xs text-magenta">{error}</p>}
        {hint && !error && <p className="text-xs text-nebula/60">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
