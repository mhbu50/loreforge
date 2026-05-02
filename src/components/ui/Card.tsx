import React from 'react';
import { cn } from '../../lib/utils';
import ThreeDCard from '../ThreeDCard';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  tilt3D?: boolean;
}

export const Card = ({ children, className, hover = true, glass, padding = 'md', tilt3D = true, ...props }: CardProps) => {
  const content = (
    <div
      className={cn(
        'bg-surface-glass border border-white/[0.06] backdrop-blur-xl rounded-2xl shadow-card transition-shadow duration-300',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-6',
        padding === 'none' && '',
        hover && 'hover:shadow-card-hover hover:border-gold/30',
        glass && 'backdrop-blur-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );

  return tilt3D ? <ThreeDCard className="block">{content}</ThreeDCard> : content;
};

export const CardHeader = ({ title, subtitle, action, children, className }: {
  title?: string; subtitle?: string; action?: React.ReactNode;
  children?: React.ReactNode; className?: string;
}) => (
  <div className={cn('flex items-start justify-between mb-5', className)}>
    {title ? (
      <>
        <div>
          <h3 className="text-lg font-serif font-semibold text-starlight">{title}</h3>
          {subtitle && <p className="text-sm text-nebula mt-1">{subtitle}</p>}
        </div>
        {action}
      </>
    ) : children}
  </div>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={cn('text-lg font-serif font-semibold text-starlight', className)}>{children}</h3>
);

export const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn('text-sm text-nebula mt-1', className)}>{children}</p>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]', className)}>{children}</div>
);
