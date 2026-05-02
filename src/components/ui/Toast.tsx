import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem { id: string; type: ToastType; title: string; description?: string; duration?: number; }

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />, error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />, info: <Info size={16} />,
};
const COLORS: Record<ToastType, string> = {
  success: 'border-l-emerald-500 text-emerald-400',
  error:   'border-l-magenta text-magenta',
  warning: 'border-l-amber-500 text-amber-400',
  info:    'border-l-gold text-gold',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), item.duration ?? 4000);
    return () => clearTimeout(t);
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-start gap-3 min-w-[320px] max-w-sm rounded-2xl border border-white/[0.08] border-l-4 bg-surface-glass shadow-card-hover backdrop-blur-2xl px-4 py-3', COLORS[item.type])}
    >
      <span className="mt-0.5 flex-shrink-0">{ICONS[item.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-starlight">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs text-nebula">{item.description}</p>}
      </div>
      <button onClick={() => onDismiss(item.id)} className="flex-shrink-0 text-nebula hover:text-starlight transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const addToast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [{ ...opts, id }, ...t].slice(0, 5));
  }, []);
  const ctx: ToastContextValue = {
    toast: addToast,
    success: (title, d) => addToast({ type: 'success', title, description: d }),
    error: (title, d) => addToast({ type: 'error', title, description: d }),
    warning: (title, d) => addToast({ type: 'warning', title, description: d }),
    info: (title, d) => addToast({ type: 'info', title, description: d }),
  };
  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => <ToastCard key={item.id} item={item} onDismiss={dismiss} />)}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
