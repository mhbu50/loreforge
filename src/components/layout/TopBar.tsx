import { Bell, User } from 'lucide-react';
import { motion } from 'motion/react';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const TopBar = ({ title, subtitle, actions }: TopBarProps) => (
  <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 border-b border-white/[0.04] bg-surface-glass/40 backdrop-blur-xl">
    <div>
      {title && <span className="font-serif font-semibold text-starlight">{title}</span>}
      {subtitle && <p className="text-xs text-nebula mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">
      {actions}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2 text-nebula hover:text-starlight transition-colors rounded-xl hover:bg-white/[0.04]"
      >
        <Bell className="w-5 h-5" />
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full"
        />
      </motion.button>
      <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
        <User className="w-4 h-4 text-gold" />
      </div>
    </div>
  </header>
);
