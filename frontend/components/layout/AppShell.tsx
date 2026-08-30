import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { CommandPalette } from '../ui/CommandPalette';
import { useWebSocket } from '../../hooks/useWebSocket';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize active WebSocket real-time connection for authenticated session
  useWebSocket();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <TopNav onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
