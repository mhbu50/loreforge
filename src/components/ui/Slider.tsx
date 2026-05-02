import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

export const Slider = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) => (
  <SliderPrimitive.Root
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/[0.08]">
      <SliderPrimitive.Range className="absolute h-full bg-gold" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 border-gold bg-starlight shadow-glow ring-offset-void transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderPrimitive.Root>
);
