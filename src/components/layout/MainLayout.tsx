import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/src/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[--bg]">
      <Sidebar />
      <main className={cn('flex flex-1 flex-col overflow-hidden', className)}>
        {children}
      </main>
    </div>
  );
}
