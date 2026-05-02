import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/src/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  // Apply dark editor theme for all app pages
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'editor');
    return () => {
      document.documentElement.setAttribute('data-theme', prev ?? localStorage.getItem('storycraft-theme') ?? 'light');
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <main className={cn('flex flex-1 flex-col overflow-hidden', className)}>
        {children}
      </main>
    </div>
  );
}
