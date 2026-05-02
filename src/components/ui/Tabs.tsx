import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn('inline-flex items-center gap-1 rounded-xl bg-void/60 border border-white/[0.06] p-1', className)}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-nebula transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-glow',
      'hover:text-starlight hover:bg-white/[0.04]',
      className
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn('mt-3 focus-visible:outline-none', className)}
    {...props}
  />
);
