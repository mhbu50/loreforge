import React from 'react';
import { Bell, User } from 'lucide-react';
import { IconButton } from '@/src/components/ui/IconButton';
import { cn } from '@/src/lib/utils';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, actions, className }: TopBarProps) {
  return (
    <header className={cn('flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-bg-secondary px-6', className)}>
      <div className="flex flex-col">
        {title && <span className="text-sm font-semibold text-text-primary">{title}</span>}
        {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <div className="ml-2 flex items-center gap-1">
          <IconButton label="Notifications" size="sm">
            <Bell size={16} />
          </IconButton>
          <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/20 border-2 border-border text-xs font-medium text-primary hover:bg-[var(--color-primary)]/30 transition-colors">
            <User size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
