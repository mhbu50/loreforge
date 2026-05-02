import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, LayoutDashboard, Users, Settings, ChevronLeft,
  Plus, Sparkles, Library, HelpCircle, FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStoryStore } from '@/src/stores/useStoryStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stories',   icon: Library,         label: 'My Stories' },
  { to: '/editor',    icon: FileText,         label: 'Editor' },
  { to: '/characters',icon: Users,            label: 'Characters' },
];

const bottomItems = [
  { to: '/app-settings', icon: Settings,   label: 'Settings' },
  { to: '/support',      icon: HelpCircle, label: 'Help' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const createStory = useStoryStore((s) => s.createStory);
  const setActiveStory = useStoryStore((s) => s.setActiveStory);

  const handleNewStory = () => {
    const story = createStory({ title: 'Untitled Story' });
    setActiveStory(story.id);
    navigate('/editor');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-screen flex-col border-r border-border bg-bg-secondary py-4 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 mb-6', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]">
          <BookOpen size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-text-primary whitespace-nowrap"
            >
              StoryCraft
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* New Story button */}
      <div className={cn('px-3 mb-4', collapsed && 'px-2')}>
        <button
          onClick={handleNewStory}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white',
            'hover:opacity-90 transition-opacity shadow-glow-sm',
            collapsed && 'justify-center px-0 py-2'
          )}
        >
          <Plus size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                New Story
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-bg-tertiary text-primary border-l-[3px] border-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover',
                collapsed && 'justify-center px-0 py-2.5 border-l-0'
              )
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        <div className="my-2 h-px bg-border" />

        <NavLink
          to="/ai-studio"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-bg-tertiary text-primary border-l-[3px] border-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover',
              collapsed && 'justify-center px-0 py-2.5 border-l-0'
            )
          }
        >
          <Sparkles size={17} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                AI Studio
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </nav>

      {/* Bottom items */}
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-bg-tertiary text-primary border-l-[3px] border-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover',
                collapsed && 'justify-center px-0 py-2.5 border-l-0'
              )
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg-secondary text-text-muted hover:text-text-primary shadow-card transition-colors z-10"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft size={12} />
        </motion.div>
      </button>
    </motion.aside>
  );
}
