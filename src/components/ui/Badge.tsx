import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'gold' | 'cyan' | 'magenta' |
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'magic';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge = ({ children, variant = 'default', dot, className, ...props }: BadgeProps) => {
  const styles: Record<BadgeVariant, string> = {
    default:  'bg-white/[0.06] text-nebula border-white/[0.1]',
    gold:     'bg-gold/15 text-gold border-gold/30',
    primary:  'bg-gold/15 text-gold border-gold/30',
    cyan:     'bg-cyan/10 text-cyan border-cyan/30',
    info:     'bg-cyan/10 text-cyan border-cyan/30',
    magenta:  'bg-magenta/10 text-magenta border-magenta/30',
    danger:   'bg-magenta/10 text-magenta border-magenta/30',
    success:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
    outline:  'bg-transparent text-nebula border-white/[0.15]',
    magic:    'bg-gradient-to-r from-gold/15 to-cyan/10 text-gold border-gold/20',
  };
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[variant], className)}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};
