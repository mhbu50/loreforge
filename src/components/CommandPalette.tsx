import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, Zap, Book, User, Settings, Image as ImageIcon, MessageSquare, Terminal, Eye, Edit3, Save, Share2, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: 'new-book', title: 'Create New Book', description: 'Start a new story, comic, or anime project', icon: <Book size={16} />, action: () => console.log('New Book'), category: 'General' },
    { id: 'zen-mode', title: 'Toggle Zen Mode', description: 'Hide UI for focused writing', icon: <Eye size={16} />, action: () => console.log('Zen Mode'), category: 'Workspace' },
    { id: 'save-draft', title: 'Save Draft', description: 'Manually save current progress', icon: <Save size={16} />, action: () => console.log('Save Draft'), category: 'General' },
    { id: 'open-settings', title: 'Open Settings', description: 'Customize your StoryCraft experience', icon: <Settings size={16} />, action: () => console.log('Settings'), category: 'General' },
    { id: 'terminal', title: 'Toggle Terminal', description: 'Run Linux commands', icon: <Terminal size={16} />, action: () => console.log('Technical'), category: 'Technical' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Group by category
  const grouped = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length === 0) return;
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length === 0) return;
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-night/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#111]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
              <Search className="text-gold flex-shrink-0" size={18} />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/25 text-base"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-md border border-white/15">
                <Command size={11} className="text-white/50" />
                <span className="text-[9px] font-mono text-white/50">P</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[52vh] overflow-y-auto p-3">
              {filteredCommands.length > 0 ? (
                Object.entries(grouped).map(([category, items]) => {
                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold px-2 mb-2">
                        {category}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((cmd) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          const isSelected = globalIndex === selectedIndex;
                          return (
                            <button
                              key={cmd.id}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                isSelected
                                  ? "bg-gold/10 border border-gold/20 text-gold"
                                  : "text-white/70 hover:bg-white/8 hover:text-white border border-transparent"
                              )}
                              onClick={() => {
                                cmd.action();
                                onClose();
                              }}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                isSelected ? "bg-gold/20 text-gold" : "bg-white/8 text-white/50"
                              )}>
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{cmd.title}</div>
                                {cmd.description && (
                                  <div className="text-[11px] text-white/40 truncate mt-0.5">{cmd.description}</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-14 text-center">
                  <Zap className="mx-auto text-white/10 mb-3" size={40} />
                  <p className="text-white/30 text-sm">No commands found for &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-white/10 border border-white/15 text-white/50 rounded-md text-[9px] px-1.5 py-0.5">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-white/10 border border-white/15 text-white/50 rounded-md text-[9px] px-1.5 py-0.5">Enter</kbd>
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest">
                <kbd className="bg-white/10 border border-white/15 text-white/50 rounded-md text-[9px] px-1.5 py-0.5">Esc</kbd>
                Close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
