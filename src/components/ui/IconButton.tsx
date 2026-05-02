import { cn } from '../../lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
}

export const IconButton = ({ label, size = 'md', className, children, ...props }: IconButtonProps) => (
  <button
    aria-label={label}
    className={cn(
      'inline-flex items-center justify-center rounded-xl text-nebula hover:text-starlight hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
      size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
