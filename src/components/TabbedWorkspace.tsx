import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, FileText, User, Map, BookOpen, ChevronLeft, ChevronRight, Sparkles, Wand2, Type, MessageSquare, Languages, ListChecks, Ghost, GitBranch } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: string;
}

interface Tab {
  id: string;
  title: string;
  type: 'chapter' | 'character' | 'lore' | 'map';
  content: React.ReactNode;
}

export default function TabbedWorkspace() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Chapter 1: The Awakening', type: 'chapter', content: <div className="p-12 max-w-2xl mx-auto font-sans text-xl leading-relaxed text-gray-800"><p>The dawn broke over the jagged peaks of Aethelgard, casting long, crimson shadows across the valley. Kaelen stood at the precipice, his breath hitching in the cold morning air...</p></div> },
    { id: '2', title: 'Kaelen Shadowstep', type: 'character', content: <div className="p-12 grid grid-cols-2 gap-12"><div className="aspect-[3/4] bg-black/5 rounded-3xl overflow-hidden"><img src="https://picsum.photos/seed/kaelen/600/800" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div><div className="space-y-6"><h2 className="text-4xl font-semibold">Kaelen Shadowstep</h2><p className="text-gray-500 italic">"The shadows are not my enemy; they are my sanctuary."</p><div className="space-y-4 pt-6"><div className="flex justify-between border-b border-black/5 pb-2"><span className="text-xs small-caps font-bold text-black/40">Age</span><span className="text-sm font-bold">24</span></div><div className="flex justify-between border-b border-black/5 pb-2"><span className="text-xs small-caps font-bold text-black/40">Origin</span><span className="text-sm font-bold">The Void Lands</span></div></div></div></div> },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isEditable, setIsEditable] = useState(true);
  const [toolbarButtons, setToolbarButtons] = useState<string[]>(['texture']);
  const [isCustomizingToolbar, setIsCustomizingToolbar] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, text: string } | null>(null);
  const [paperTexture, setPaperTexture] = useState<'none' | 'parchment' | 'recycled' | 'digital'>('none');

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection()?.toString();
    if (selection) {
      setContextMenu({ x: e.clientX, y: e.clientY, text: selection });
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const allButtons: ToolbarButton[] = [
    { id: 'texture', icon: <BookOpen size={14} />, label: 'Paper Texture', action: 'texture' },
  ];

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleAction = (action: string) => {
    if (action === 'texture') {
      const textures: ('none' | 'parchment' | 'recycled' | 'digital')[] = ['none', 'parchment', 'recycled', 'digital'];
      const nextIndex = (textures.indexOf(paperTexture) + 1) % textures.length;
      setPaperTexture(textures[nextIndex]);
    }
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const getIcon = (type: Tab['type']) => {
    switch (type) {
      case 'chapter': return <FileText size={14} />;
      case 'character': return <User size={14} />;
      case 'lore': return <BookOpen size={14} />;
      case 'map': return <Map size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border card-elevated overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center bg-app-raised border-b border-app-light px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveTabId(tab.id);
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-3 px-6 py-4 border-r border-app-light transition-all relative group min-w-[180px] cursor-pointer outline-none",
                activeTabId === tab.id ? "bg-app-card text-app border-accent-soft" : "text-app-subtle hover:bg-app-sunken hover:text-app-muted"
              )}
            >
              <span className={cn(
                "p-1.5 rounded-md transition-colors",
                activeTabId === tab.id ? "bg-accent-bg text-accent" : "bg-app-tertiary"
              )}>
                {getIcon(tab.type)}
              </span>
              <span className="text-sm font-semibold truncate max-w-[100px]">{tab.title}</span>
              {isEditable && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="ml-auto p-1 hover:bg-red-50/20 hover:text-red-400 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
              {activeTabId === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t" />
              )}
            </div>
          ))}
          <button className="p-4 text-app-subtle hover:text-accent transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-app-card border-b border-app-light px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {toolbarButtons.map(btnId => {
            const btn = allButtons.find(b => b.id === btnId);
            if (!btn) return null;
            return (
              <button
                key={btn.id}
                onClick={() => handleAction(btn.action)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-app-secondary rounded-md transition-all text-app-subtle hover:text-app"
              >
                {btn.icon}
                <span className="text-xs font-semibold uppercase tracking-wide">{btn.label}</span>
              </button>
            );
          })}
          <button 
            onClick={() => setIsCustomizingToolbar(!isCustomizingToolbar)}
            className="p-1.5 text-app-subtle hover:text-accent transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs small-caps font-semibold text-app-subtle">
          <span>{activeTab?.type === 'chapter' ? '1,240 words' : ''}</span>
          <span>Auto-saved 2m ago</span>
        </div>
      </div>

      {/* Toolbar Customizer */}
      <AnimatePresence>
        {isCustomizingToolbar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-app-secondary border-b border-app-light overflow-hidden"
          >
            <div className="p-6 flex flex-wrap gap-3">
              {allButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => {
                    if (toolbarButtons.includes(btn.id)) {
                      setToolbarButtons(toolbarButtons.filter(id => id !== btn.id));
                    } else {
                      setToolbarButtons([...toolbarButtons, btn.id]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    toolbarButtons.includes(btn.id)
                      ? "bg-accent border-accent text-app-inverse"
                      : "bg-app-card border-app-default text-app-subtle hover:border-accent hover:text-accent"
                  )}
                >
                  {btn.icon}
                  <span className="text-xs font-semibold">{btn.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar relative",
          paperTexture === 'none' ? "bg-app-card" : 
          paperTexture === 'parchment' ? "bg-accent-soft" :
          paperTexture === 'recycled' ? "bg-app-tertiary" : "bg-app-secondary"
        )}
        onContextMenu={handleContextMenu}
      >
        {paperTexture !== 'none' && (
          <div className={cn(
            "absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply",
            paperTexture === 'parchment' ? "bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" :
            paperTexture === 'recycled' ? "bg-[url('https://www.transparenttextures.com/patterns/recycled-paper.png')]" :
            "bg-[url('https://www.transparenttextures.com/patterns/white-paper.png')]"
          )} />
        )}
        <AnimatePresence mode="wait">
          {activeTab ? (
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full p-12"
            >
              <div className="max-w-4xl mx-auto font-sans text-base leading-relaxed text-app">
                {activeTab.content}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-app-subtle">
              <BookOpen size={48} className="mb-6 opacity-20" />
              <h3 className="text-2xl font-semibold text-app mb-2">No Active Tabs</h3>
              <p className="text-sm">Select a chapter or character to begin crafting.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

    <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-[500] panel border-accent ring-accent shadow-lg min-w-[200px]"
          >
            <div className="p-3 border-b border-app-light">
              <div className="text-xs small-caps tracking-wider font-semibold text-app-subtle">Editor Tools</div>
            </div>
            <div className="p-2 space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent-bg rounded-lg transition-all text-sm text-app hover:text-accent">
                <FileText size={14} />
                <span>Copy to Clipboard</span>
              </button>
              <div className="h-px bg-app-light my-1" />
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all text-sm">
                <X size={14} />
                <span>Clear Selection</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
