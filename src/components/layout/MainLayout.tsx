import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const MainLayout = ({ children, className, title, subtitle, actions }: MainLayoutProps) => (
  <div className="min-h-screen bg-void relative">
    {/* Ambient nebula layers */}
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: 'radial-gradient(circle at 20% 20%, rgba(100,213,202,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,168,67,0.04) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(236,107,140,0.02) 0%, transparent 60%)',
      }}
    />
    <Sidebar />
    <div className="pl-[80px] lg:pl-[280px] transition-all duration-300 flex flex-col min-h-screen">
      <TopBar title={title} subtitle={subtitle} actions={actions} />
      <main className={cn('flex-1 p-6 md:p-8 relative z-10', className)}>
        {children}
      </main>
    </div>
  </div>
);
