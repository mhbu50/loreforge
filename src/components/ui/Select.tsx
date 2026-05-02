import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger
    className={cn(
      'flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-void/80 px-4 py-3 text-sm text-starlight placeholder:text-nebula/60',
      'focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-all duration-200 backdrop-blur-sm',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      '[&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon><ChevronDown className="w-4 h-4 text-nebula" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

export const SelectContent = ({ className, children, position = 'popper', ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      position={position}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-xl border border-gold/20 bg-surface backdrop-blur-2xl text-starlight shadow-card-hover',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' && 'translate-y-1',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

export const SelectLabel = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) => (
  <SelectPrimitive.Label className={cn('px-3 py-1.5 text-xs font-semibold text-nebula/60 uppercase tracking-wider', className)} {...props} />
);

export const SelectItem = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none',
      'focus:bg-gold/10 focus:text-gold data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator><Check className="w-3.5 h-3.5 text-gold" /></SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

export const SelectSeparator = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) => (
  <SelectPrimitive.Separator className={cn('my-1 h-px bg-white/[0.06]', className)} {...props} />
);
