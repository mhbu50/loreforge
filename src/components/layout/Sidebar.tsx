import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Wand2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: BookOpen, label: 'Library',   path: '/dashboard' },
  { icon: Wand2,    label: 'AI Studio', path: '/editor' },
  { icon: Sparkles, label: 'Characters',path: '/characters' },
  { icon: Settings, label: 'Settings',  path: '/app-settings' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed left-0 top-0 bottom-0 bg-surface-glass border-r border-white/[0.06] backdrop-blur-2xl z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gold/15 border border-gold/30">
          <Sparkles className="w-4 h-4 text-gold" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 font-serif font-bold text-xl text-starlight whitespace-nowrap"
            >
              DreamForge
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gold/15 text-gold border border-gold/20 shadow-glow'
                    : 'text-nebula hover:text-starlight hover:bg-white/[0.04]'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-4 border-t border-white/[0.06] text-nebula hover:text-starlight hover:bg-white/[0.04] transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-sm whitespace-nowrap">
              Collapse
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.aside>
  );
};
