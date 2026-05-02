import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const spinning = isLoading || loading;
    const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/60 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';
    const variants = {
      primary:   'bg-gold text-void hover:bg-gold-glow shadow-glow',
      secondary: 'bg-surface-glass text-starlight border border-gold/30 hover:border-gold hover:bg-gold/5 backdrop-blur-xl',
      ghost:     'bg-transparent text-nebula hover:text-starlight hover:bg-surface-hover',
      danger:    'bg-magenta/10 text-magenta hover:bg-magenta/20',
    };
    const sizes = {
      sm:   'px-3 py-1.5 text-sm rounded-[10px] gap-1.5',
      md:   'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg:   'px-7 py-3 text-base rounded-2xl gap-2',
      icon: 'h-10 w-10 rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={spinning || disabled}
        {...(props as any)}
      >
        {spinning ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {!spinning && rightIcon}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
export { Button };
