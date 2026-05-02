import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const ThreeDCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotate({ x: ((y - centerY) / centerY) * -8, y: ((x - centerX) / centerX) * 8 });
    setGlowPosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlowPosition({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
      className={cn('relative', className)}
    >
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full"
      >
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(212,168,67,0.15) 0%, transparent 60%)`,
          }}
        />
        {children}
      </motion.div>
    </motion.div>
  );
};
export default ThreeDCard;
